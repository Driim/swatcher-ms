import path from 'path';
import mongoose from 'mongoose';
import uniqWith from 'lodash.uniqwith';
import dotenv from 'dotenv';
import ProgressBar from 'ora-progress-bar';
import {
  UserSchema,
  SerialSchema,
  SubscriptionSchema,
  PayerSchema,
  AnnounceSchema,
} from '../schemas';
import { User, Serial, Season, SubscriptionSerialSchema, Payer, Announce } from '../interfaces';
import {
  USER_COLLECTION,
  SERIAL_COLLECTION,
  SUBS_COLLECTION,
  ANNOUNCE_COLLECTION,
  PAYER_COLLECTION,
} from '../app.constants';

const OldUserSchema = new mongoose.Schema({
  id: Number,
  first_name: String,
  last_name: String,
  username: String,
  type: String,
  active: Number,
  status: Number,
});

interface OldUser extends mongoose.Document {
  id: number;
  username: string;
  first_name: string;
  active: number;
  status: number;
}

const OldSerialSchema = new mongoose.Schema({
  name: { type: [String], index: true },
  alias: Array,
  genre: Array,
  country: Array,
  director: Array,
  season: [
    {
      name: String,
      desc: String,
      img: String,
      url: String,
      starts: Number,
      actors: Array,
    },
  ],
  fans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'fans' }],
  voice_over: Array,
});

interface OldSeason {
  name: string;
  desc: string;
  img: string;
  url: string;
  starts: number;
  actors: string[];
}

interface OldSerial extends mongoose.Document {
  name: string[];
  alias: string[];
  genre: string[];
  country: string[];
  director: string[];
  season: OldSeason[];
  fans: OldUser[];
  voice_over: string[];
}

const OldAnnounceSchema = new mongoose.Schema({
  name: String,
  date: Date,
  serial: { type: mongoose.Schema.Types.ObjectId, ref: 'serials' },
  season: String,
  series: [
    {
      num: String,
      studio: String,
    },
  ],
});

interface OldAnnounce extends mongoose.Document {
  name: string;
  date: Date;
  season: string;
  serial: OldSerial;
  series: Array<{ num: string; studio: string }>;
}

const OldPayerSchema = new mongoose.Schema({
  fan: String,
  date: Date,
  amount: Number,
});

interface OldPayer extends mongoose.Document {
  fan: string;
  date: Date;
  amount: number;
}

const ITERATION_LIMIT = 1000;

const envFilePath = path.join(process.cwd(), '.env');

const migration = async (): Promise<void> => {
  dotenv.config({ path: envFilePath });

  const oldDatabase = await mongoose.createConnection(process.env.OLD_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

  const OldUserModel = oldDatabase.model<OldUser>('fans', OldUserSchema);
  const OldSerialModel = oldDatabase.model<OldSerial>('serials', OldSerialSchema);
  const OldAnnounceModel = oldDatabase.model<OldAnnounce>('news', OldAnnounceSchema);
  const OldPayerModel = oldDatabase.model<OldPayer>('subscriptions', OldPayerSchema);

  const newDatabase = await mongoose.createConnection(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

  const UserModel = newDatabase.model<User>(USER_COLLECTION, UserSchema);
  const SubscriptionModel = newDatabase.model<SubscriptionSerialSchema>(
    SUBS_COLLECTION,
    SubscriptionSchema,
  );
  const SerialModel = newDatabase.model<Serial>(SERIAL_COLLECTION, SerialSchema);
  const AnnounceModel = newDatabase.model<Announce>(ANNOUNCE_COLLECTION, AnnounceSchema);
  const PayerModel = newDatabase.model<Payer>(PAYER_COLLECTION, PayerSchema);

  const oldUsersCount = await OldUserModel.count({});
  let pages = Math.ceil(oldUsersCount / ITERATION_LIMIT);

  let progressBar = new ProgressBar('Migrating users', pages);

  /** Move users */
  for (let i = 0; i < pages; i++) {
    const oldUsers = await OldUserModel.find()
      .skip(i * ITERATION_LIMIT)
      .limit(ITERATION_LIMIT)
      .exec();

    for (const oldUser of oldUsers) {
      const newUser = new UserModel();
      newUser.id = oldUser.id;
      newUser.username = oldUser.username ? oldUser.username : oldUser.first_name;
      newUser.active = oldUser.active === 1 ? true : false;
      newUser.payed = oldUser.status ? oldUser.status : 0;
      newUser.type = 'telegram';

      await newUser.save();
    }

    progressBar.progress();
  }

  /** Move serials and subscriptions */
  const oldSerialsCount = await OldSerialModel.count({});
  pages = Math.ceil(oldSerialsCount / ITERATION_LIMIT);

  progressBar = new ProgressBar('Migrating serials and subscriptions', pages);

  for (let i = 0; i < pages; i++) {
    const oldSerials = await OldSerialModel.find({})
      .skip(i * ITERATION_LIMIT)
      .limit(ITERATION_LIMIT)
      .populate('fans')
      .exec();

    for (const oldSerial of oldSerials) {
      const newSerial = new SerialModel();

      /** Here we can make additional checks */
      newSerial.name = oldSerial.name[0];
      newSerial.alias = oldSerial.alias;
      newSerial.genre = oldSerial.genre;
      newSerial.country = oldSerial.country;
      newSerial.director = oldSerial.director;
      newSerial.voiceover = oldSerial.voice_over;
      newSerial.season = [];

      /** check season duplicates */
      const oldSeasons = uniqWith(
        oldSerial.season,
        (a: OldSeason, b: OldSeason) => a.name === b.name,
      ) as OldSeason[];

      if (oldSeasons.length !== oldSerial.season.length) {
        console.log(
          `\nСериал ${newSerial.name} имел ${oldSerial.season.length -
            oldSeasons.length} дубликатов в сезонах\n`,
        );
      }

      for (const oldSeason of oldSeasons) {
        const season = new Season();

        season.actors = oldSeason.actors;
        season.desc = oldSeason.desc;
        season.img = oldSeason.img;
        season.name = oldSeason.name;
        season.url = oldSeason.url;
        /** check season start date */
        season.starts = oldSeason.starts > 1970 ? oldSeason.starts : null;

        newSerial.season.push(season);
      }

      await newSerial.save();

      /** Create subscription model and move all subscribers */
      const subs = new SubscriptionModel();
      subs.serial = newSerial._id as mongoose.Schema.Types.ObjectId;
      subs.fans = [];

      for (const oldUser of oldSerial.fans) {
        const newUser = await UserModel.findOne({ id: oldUser.id });

        if (!newUser) {
          console.log(`Can't find user with ID: ${oldUser.id}`);
          continue;
        }

        subs.fans.push({
          user: newUser._id as mongoose.Types.ObjectId,
          voiceover: [],
        });
      }

      await subs.save();
    }

    progressBar.progress();
  }

  const oldAnnouncesCount = await OldAnnounceModel.count({});
  pages = Math.ceil(oldAnnouncesCount / ITERATION_LIMIT);

  progressBar = new ProgressBar('Migrating announces', pages);

  for (let i = 0; i < pages; i++) {
    const oldAnnounces = await OldAnnounceModel.find({})
      .skip(i * ITERATION_LIMIT)
      .limit(ITERATION_LIMIT)
      .populate('serial')
      .exec();

    for (const oldAnnounce of oldAnnounces) {
      if (!oldAnnounce.serial) {
        console.log(`\n Announce for not existing serial ${oldAnnounce.name}`);
        continue;
      }

      const serial = await SerialModel.findOne({ name: oldAnnounce.serial.name[0] });

      if (!serial) {
        console.log(`\n Can't find serial ${oldAnnounce.serial.name[0]}`);
        continue;
      }

      for (const series of oldAnnounce.series) {
        const announce = new AnnounceModel();

        announce.name = serial.name;
        announce.date = oldAnnounce.date;
        announce.season = oldAnnounce.season;
        announce.series = series.num;
        announce.studio = series.studio === '' ? null : series.studio;
        announce.serial = serial._id as mongoose.Schema.Types.ObjectId;

        await announce.save();
      }
    }

    progressBar.progress();
  }

  const oldPayersCount = await OldPayerModel.count({});
  pages = Math.ceil(oldPayersCount / ITERATION_LIMIT);

  progressBar = new ProgressBar('Migrating payers', pages);

  for (let i = 0; i < pages; i++) {
    const oldPayers = await OldPayerModel.find({})
      .skip(i * ITERATION_LIMIT)
      .limit(ITERATION_LIMIT)
      .exec();

    for (const oldPayer of oldPayers) {
      const user = await UserModel.findOne({ id: parseInt(oldPayer.fan, 10) });

      if (!user) {
        console.log(`\n Can't find user ${oldPayer.fan}`);
        continue;
      }

      const payer = new PayerModel();

      payer.amount = oldPayer.amount;
      payer.date = oldPayer.date;
      payer.user = user._id as mongoose.Schema.Types.ObjectId;

      await payer.save();
    }

    progressBar.progress();
  }
};

migration();

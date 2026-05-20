// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_white_moondragon.sql';
import m0001 from './0001_awesome_wild_pack.sql';
import m0002 from './0002_harsh_doctor_doom.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002
    }
  }
  
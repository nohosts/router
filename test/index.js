const crc32 = require('crc32');

console.log(parseInt(crc32('cr32'), 16) % 120, parseInt(crc32('crss32'), 16) % 120, parseInt(crc32('cr3as2'), 16) % 120);

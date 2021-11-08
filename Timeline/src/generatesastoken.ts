'use strict';
import crypto from "crypto"

export interface TokenArgs {
  secret: string,
  organization: string,
  namespace: string,
  service: string,
  permissions: string,
  keyName: string,
  expiration: number
}

function generateExpiration(args: number) {
  var validitySum = 0;
  validitySum += args ? args * 60 * 60 * 24 : 0;
  // validitySum += parseInt(args['vh']) ? args['vh'] * 60 * 60 : 0;

  if (validitySum === 0) {
    //default 1 week
    validitySum = 60 * 60 * 24 * 7;
  }

  var now = new Date();
  return Math.round(now.getTime()) + (validitySum * 1000);
}

// function verifyArguments(args: string) {
//   const parser = new ArgumentParser({
//     description: 'SAS Token Generator!'
//   });

//   parser.add_argument('-v', '--version', { action: 'version', version });
//   parser.add_argument('-secret', { help: 'secret: your secret key' });
//   parser.add_argument('-o', { help: 'organization: organization' });
//   parser.add_argument('-n', { help: 'namespace: customer namespace' });
//   parser.add_argument('-s', { help: 'service: particular service to be queried' });
//   parser.add_argument('-p', { help: 'permissions: one of the following (r|w|rw)' });
//   parser.add_argument('-kn', { help: 'keyname: key name' });
//   parser.add_argument('-vd', { help: 'validitydays: expire in this number of days' });
//   parser.add_argument('-vh', { help: 'validityhours:expire in this number of hours' });

//   var args = parser.parse_args();

//   if (!args['secret']) {
//     throw '-secret argument missing!';
//   }
//   if (!args['o']) {
//     throw '-o argument missing!';
//   }
//   if (!args['n']) {
//     throw '-n argument missing!';
//   }
//   if (!args['s']) {
//     throw '-s argument missing!';
//   }
//   if (!args['p']) {
//     throw '-p argument missing!';
//   }
//   if (!args['kn']) {
//     throw '-kn argument missing!';
//   }

//   return args;
// }

export function generateSasToken(args: TokenArgs) {
  const { secret, organization, namespace, service, permissions, keyName, expiration } = args;
  var calculatedExpiration = new Date(generateExpiration(expiration)).toISOString();
  var sasTokenPrefix = `so=${organization}&sn=${namespace}&ss=${service}&sp=${permissions}&se=${calculatedExpiration}&sk=${keyName}`;
  var signature = encodeURIComponent(crypto.createHmac('sha256', secret).update(sasTokenPrefix).digest('base64'));
  return `${sasTokenPrefix}&sig=${signature}`;
}

/* Begin */
export function makeToken(args: TokenArgs) {
  try {
    // var verifiedArguments = verifyArguments(args);
    var sasToken = generateSasToken(args);
    console.log('\n-- SUCCESS --')
    console.log(sasToken);
  } catch (err) {
    console.log('\n-- ERROR --')
    console.log(err);
  }
}
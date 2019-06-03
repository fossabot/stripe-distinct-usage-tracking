const moment = require('moment-timezone')
const admin = require('firebase-admin')

const _firebaseConfig = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: `-----BEGIN PRIVATE KEY-----${
    process.env.FIREBASE_PRIVATE_KEY
  }-----END PRIVATE KEY-----\n`.replace(/\\n/g, '\n'),
  client_email: `firebase-adminsdk-3gpvn@${
    process.env.FIREBASE_PROJECT_ID
  }.iam.gserviceaccount.com`,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-3gpvn%40${
    process.env.FIREBASE_PROJECT_ID
  }.iam.gserviceaccount.com`
}

// console.log('_firebaseConfig',_firebaseConfig)
if (!admin.apps.length) {
  const admin = require('firebase-admin')
  admin.initializeApp({
    credential: admin.credential.cert(_firebaseConfig),
    databaseURL: `https://${_firebaseConfig.project_id}.firebaseio.com`
  })
}
const firestore = admin.firestore()

exports.newThisPeriod = data => {
  return new Promise((resolve, reject) => {
    const trackedRef = firestore
      .collection('applications')
      .doc(`${data.applicationId}`)
      .collection(`${data.collectionId}`)
      .doc(`${data.subscription.id}`)
      .collection(
        `${moment
          .unix(data.subscription.current_period_start)
          .format('MMDDYYYY')}_${moment
          .unix(data.subscription.current_period_end)
          .format('MMDDYYYY')}`
      )
      .doc(`${data.tracked.id}`)

    return trackedRef
      .get()
      .then(billingPeriodTrackedRecord => {
        // console.log('billingPeriodTrackedRecord',billingPeriodTrackedRecord)
        return trackedRef
          .set(
            {
              value: data.tracked.value,
              usage: admin.firestore.FieldValue.arrayUnion(
                moment()
                  .utc()
                  .format()
              )
            },
            { merge: true }
          )
          .then(() => {
            // console.log(
            //   `trackedRef, newThisPeriod: ${!billingPeriodTrackedRecord.exists}`
            // )
            resolve(!billingPeriodTrackedRecord.exists)
          })
          .catch(error => reject(error))
      })
      .catch(error => reject(error))
  })
}
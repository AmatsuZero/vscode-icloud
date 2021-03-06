const iCloudApps = {
	"contacts": {
		"path": "contacts/",
		"requiredServices": ["contacts", "keyvalue"],
		"pushTopic": "73f7bfc9253abaaa423eba9a48e9f187994b7bd9",
		"isBeta": false,
		"isWWW": true,
		"supportsLite": true,
		"instanceName": "Contacts",
		"modulePath": "resources/apps/Contacts"
	},
	"calendar": {
		"path": "calendar/",
		"requiredServices": ["calendar", "keyvalue"],
		"pushTopic": "dce593a0ac013016a778712b850dc2cf21af8266",
		"showsPushNotifications": true,
		"awakesInBackgroundFromPush": true,
		"isBeta": false,
		"isWWW": true,
		"isFuture": true,
		"instanceName": "Calendar",
		"modulePath": "resources/apps/Calendar"
	},
	"find": {
		"requiredServices": ["findme"],
		"pushTopic": "f68850316c5241d8fd120f3bc6da2ff4a6cca9a8",
		"showsPushNotifications": true,
		"awakesInBackgroundFromPush": true,
		"isBeta": false,
		"isWWW": true,
		"isFuture": false,
		"instanceName": "FindMe",
		"modulePath": "resources/apps/FindMe"
	},
	"fmf": {
		"requiredServices": ["fmf"],
		"isBeta": false,
		"isWWW": true,
		"instanceName": "Friends",
		"modulePath": "resources/apps/Friends"
	},
	"mail": {
		"path": "mail/",
		"requiredServices": ["mail"],
		"pushTopic": "e850b097b840ef10ce5a7ed95b171058c42cc435",
		"showsPushNotifications": true,
		"awakesInBackgroundFromPush": true,
		"isBeta": true,
		"isWWW": true,
		"isFuture": true,
		"supportsPhoneNumberBasedAppleId": false,
		"instanceName": "Mail",
		"modulePath": "resources/apps/Mail"
	},
	"notes": {
		"path": "notes/",
		"requiredServices": ["mail"],
		"pushTopic": null,
		"pushTopicOld": "c5292888edbd54273cf7c82fe861b81f0d2b87ef",
		"alternateAppName": "notes2",
		"supportsCKSharing": false,
		"isBeta": false,
		"isWWW": true,
		"isSupportedOnMobile": false
	},
	"notes2": {
		"path": "notes2/",
		"alternateAppName": "notes",
		"requiredServices": ["ckdatabasews"],
		"isBeta": false,
		"isWWW": true,
		"isSupportedOnMobile": false,
		"supportsLite": true,
		"isPCSRequired": true,
		"preloadCoreTypes": true,
		"isHidden": "YES",
		"containerIdentifier": "com.apple.notes",
		"shareInfo": {
			"titleFields": [{
				"name": "TitleEncrypted",
				"type": "EncryptedBytes"
			}]
		},
		"instanceName": "Notes",
		"modulePath": "resources/apps/Notes"
	},
	"reminders": {
		"path": "reminders/",
		"requiredServices": ["reminders", "keyvalue"],
		"pushTopic": "8a40cb6b1d3fcd0f5c204504eb8fb9aa64b78faf",
		"showsPushNotifications": true,
		"awakesInBackgroundFromPush": true,
		"isBeta": false,
		"isWWW": true,
		"isFuture": true,
		"instanceName": "Reminders",
		"modulePath": "resources/apps/Reminders"
	},
	"photos": {
		"path": "photos/",
		"requiredServices": ["ckdatabasews"],
		"isFuture": true,
		"isBeta": false,
		"isWWW": true,
		"isPCSRequired": true,
		"containerIdentifier": "com.apple.photos.cloud",
		"instanceName": "Photos",
		"modulePath": "resources/apps/Photos"
	},
	"iclouddrive": {
		"path": "iclouddrive/",
		"isFuture": true,
		"isBeta": true,
		"isWWW": true,
		"isPCSRequired": true,
		"preloadCoreTypes": true,
		"hasUIForAcceptedSharesOnMobile": true,
		"shareInfo": {
			"titleFields": [{
				"name": "encryptedBasename",
				"type": "EncryptedBytes"
			}, {
				"name": "bounceNo",
				"type": "Number"
			}]
		},
		"containerIdentifier": "com.apple.clouddocs",
		"instanceName": "Drive",
		"modulePath": "resources/apps/Drive"
	},
	"settings": {
		"path": "settings/",
		"supportsLite": true,
		"isFuture": true,
		"isBeta": false,
		"isWWW": true
	},
	"pages": {
		"requiredServices": ["ubiquity", "iwmb", "keyvalue"],
		"supportedFileExtensions": ["pages"],
		"pushTopic": "5a5fc3a1fea1dfe3770aab71bc46d0aa8a4dad41",
		"supportsLite": true,
		"isPCSRequired": true,
		"isCarry": false,
		"additionalSupportedLocales": ["ar-sa", "iw-il"],
		"containerIdentifier": "com.apple.clouddocs"
		,
		"shareInfo": {
			"titleFields": [{
				"name": "encryptedBasename",
				"type": "EncryptedBytes"
			}, {
				"name": "bounceNo",
				"type": "Number"
			}],
			"thumbnailField": {
				"name": "thumb1024",
				"type": "Asset"
			}
		}
	},
	"numbers": {
		"requiredServices": ["ubiquity", "iwmb", "keyvalue"],
		"supportedFileExtensions": ["numbers"],
		"pushTopic": "5a5fc3a1fea1dfe3770aab71bc46d0aa8a4dad41",
		"supportsLite": true,
		"isPCSRequired": true,
		"isCarry": false,
		"containerIdentifier": "com.apple.clouddocs",
		"shareInfo": {
			"titleFields": [{
				"name": "encryptedBasename",
				"type": "EncryptedBytes"
			}, {
				"name": "bounceNo",
				"type": "Number"
			}],
			"thumbnailField": {
				"name": "thumb1024",
				"type": "Asset"
			}
		}
	},
	"keynote": {
		"requiredServices": ["ubiquity", "iwmb", "keyvalue"],
		"supportedFileExtensions": ["key"],
		"pushTopic": "5a5fc3a1fea1dfe3770aab71bc46d0aa8a4dad41",
		"supportsLite": true,
		"isPCSRequired": true,
		"isCarry": false,
		"additionalSupportedLocales": ["ar-sa", "iw-il"],
		"containerIdentifier": "com.apple.clouddocs",
		"shareInfo": {
			"titleFields": [{
				"name": "encryptedBasename",
				"type": "EncryptedBytes"
			}, {
				"name": "bounceNo",
				"type": "Number"
			}],
			"thumbnailField": {
				"name": "thumb1024",
				"type": "Asset"
			}
		}
	}
};

export default iCloudApps;
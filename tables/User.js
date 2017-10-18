var azureMobileApps = require('azure-mobile-apps'),
    promises = require('azure-mobile-apps/src/utilities/promises'),
    logger = require('azure-mobile-apps/src/logger');

var azure = require('azure-sb');
var table = azureMobileApps.table();

var notificationHubService = azure.createNotificationHubService('goodbuy-push', 'Endpoint=sb://goodbuy.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=6KUDiCOPb5sNJBlAjvdaOjyc4/f//2yasT8+o2vTxFc=');

table.insert(function (context) {
    logger.info('Running User.insert');    
    var installationId = context.req.headers['x-zumo-installation-id'];
    var novaTag = context.item.id;
    notificationHubService.getInstallation(installationId,(error, installation) => {        
        if (installation.tags.indexOf(novaTag) === -1) { //novo usuário
            installation.tags.push(`user:${novaTag}`);
            console.log('instalationUser', installation);
            return notificationHubService.createOrUpdateInstallation(installation,(error, result) => console.log('user ok', result));
        }
    });

    return context.execute()
        .then(function (results) {
        // Only do the push if configured     
        // Don't forget to return the results from the context.execute()
        return results;
    }).catch(function (error) {
        logger.error('Error while 3 running context.execute: ', error);
    });
});

module.exports = table;  
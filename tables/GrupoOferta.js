var azureMobileApps = require('azure-mobile-apps'),
    promises = require('azure-mobile-apps/src/utilities/promises'),
    logger = require('azure-mobile-apps/src/logger');

var azure = require('azure-sb');
var table = azureMobileApps.table();
var notificationHubService = azure.createNotificationHubService('goodbuy-push', 'Endpoint=sb://goodbuy.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=6KUDiCOPb5sNJBlAjvdaOjyc4/f//2yasT8+o2vTxFc=');

function updateTagInstallation(installation, nomeAntigo, novoValor) {
    var index = installation.tags.indexOf(novoValor.id);
    var message = '';
        
    if (index !== -1) { //achou        
        //installation.tags[index] = novoValor.name;
        message = nomeAntigo !== novoValor.name ? `O grupo ${nomeAntigo} foi renomeado para ${novoValor.name}` : `O grupo ${nomeAntigo} teve a privacidade alterada`;
        // notificationHubService.createOrUpdateInstallation(installation,(error, result) => {
            var payload = {
                data: {
                    key: '701',
                    message,
                }
            };            
            console.log('vai enviar', payload, novoValor.id);
            notificationHubService.gcm.send(novoValor.id, payload, function (error) {
            });
        //});
    }
}

table.insert(function (context) {
    delete context.item.delete;
    return context.execute()
        .then(function (results) {
        if (context.push) {
        }
        return results;
    }).catch(function (error) {
        logger.error('Error while 2 running context.execute: ', error);
    });
});

table.update(function (context) {
    logger.info('Running GrupoOferta.update');

    var deleted = context.item.delete;
    var query = undefined;
    if (deleted) {
        console.log('ENTREI');
        query = {
            sql: `update GrupoOferta set deleted = 1
                  WHERE GrupoOferta.Id=@Id`,
            parameters: [
                { name: 'Id', value: context.item.id },
            ],
        };
    } else {
        var installationId = context.req.headers['x-zumo-installation-id'];
        query = {
            sql: `SELECT GrupoOferta.Name FROM GrupoOferta
        WHERE Id=@Id`,
            parameters: [
                { name: 'Id', value: context.item.id },
            ],
        };
        context.data.execute(query).then(function (nomeAntigoGrupo) {
            notificationHubService.getInstallation(installationId,(error, result) => updateTagInstallation(result, nomeAntigoGrupo[0].Name, context.item));
        });
    }
    delete context.item.delete;  
    // Execute the insert.  The insert returns the results as a Promise,
    // Do the push as a post-execute action within the promise flow.
    return context.execute()
        .then(function (results) {
        if (deleted) {
            context.data.execute(query);
        }
        return results;
    }).catch(function (error) {
        logger.error('Error while 4 running context.execute: ', error);
    });
});

module.exports = table;  
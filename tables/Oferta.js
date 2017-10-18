var azureMobileApps = require('azure-mobile-apps'),
    promises = require('azure-mobile-apps/src/utilities/promises'),
    logger = require('azure-mobile-apps/src/logger');

var azure = require('azure-sb');
var table = azureMobileApps.table();

var notificationHubService = azure.createNotificationHubService('goodbuy-push', 'Endpoint=sb://goodbuy.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=6KUDiCOPb5sNJBlAjvdaOjyc4/f//2yasT8+o2vTxFc=');

function sendNotification(idOferta, tags) {
    console.log('3', 'tags', tags);
    var message = 'A oferta que você estava monitorando foi teve o preço atingido';
    var key = 710;
    tags.forEach(function (element) {
        var payload = {
            data: {
                key,
                ofertaTitle: 'Alerta de preço atingido',
                ofertaDescription: message,
                idOferta,
            },
        };
        console.log('vou enviar', payload, `user:${element.IdUser}`);
        notificationHubService.gcm.send(
            `user:${element.IdUser}`,
            payload, function (error) {
                if (!error) {
                    //notification sent
                }
            });

    });
    return;
}

table.update(function (context) {
    logger.info('Running Oferta.update');

    var query = {
        sql: `select distinct MonitoramentoOferta.IdUser from MonitoramentoOferta
                  WHERE MonitoramentoOferta.IdOferta =@IdOferta and MonitoramentoOferta.PrecoAlvo >= @preco`,
        parameters: [
            { name: 'IdOferta', value: context.item.id },
            { name: 'preco', value: context.item.precoAtual },
        ],
    };

    context.data.execute(query).then(function (result) {
        if (context.push) {
            sendNotification(context.item.id, result);
        }
    });
    return context.execute()
        .then(function (results) {
        return results;
    }).catch(function (error) {
        logger.error('Error while 2 running context.execute: ', error);
    });
});

module.exports = table;

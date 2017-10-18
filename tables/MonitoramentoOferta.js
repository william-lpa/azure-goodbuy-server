//var table = module.exports = require('azure-mobile-apps').table();

var azureMobileApps = require('azure-mobile-apps'),
    promises = require('azure-mobile-apps/src/utilities/promises'),
    logger = require('azure-mobile-apps/src/logger');

var azure = require('azure-sb');
var table = azureMobileApps.table();
table.softDelete = false;

var notificationHubService = azure.createNotificationHubService('goodbuy-push', 'Endpoint=sb://goodbuy.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=6KUDiCOPb5sNJBlAjvdaOjyc4/f//2yasT8+o2vTxFc=');

function sendNotification(key, message, tag) {

    var payload = {
        data: {
            key,
            message,
        }
    };
    console.log('vou enviar p monitore', `user:${tag}`, message);
    notificationHubService.gcm.send(
        `user:${tag}`,
        payload, function (error) {
            if (!error) {
                //notification sent
            }
        });
}


table.insert(function (context) {
    logger.info('Running Monitoramentooferta.insert');

    console.log('aq', context.item);
    delete context.item.delete;
    return context.execute()
        .then(function (results) {
        if (context.push) {
            sendNotification('707', 'Novo alerta criado com sucesso!', context.item.idUser);
        }
        return results;
    }).catch(function (error) {
        logger.error('Error while 2 running context.execute: ', error);
    });
});

table.update(function (context) {
    logger.info('Running Monitore.update');
    var deletar = context.item.delete;
    delete context.item.delete;
    if (deletar) {

        var query = {
            sql: `update MonitoramentoOferta set deleted = 1
                  WHERE MonitoramentoOferta.Id =@Id`,
            parameters: [
                { name: 'Id', value: context.item.id },
            ],
        };
    }
    return context.execute().then(function (results) {
        if (deletar) {
            context.data.execute(query).then(function () {
                sendNotification('709', 'Alerta removido com sucesso', context.item.idUser);
            });
        }
        else {
            sendNotification('708', 'Alerta de preço atualizado', context.item.idUser);
        }
        return results;
    });
});

table.delete(function (context) {
    logger.info('Running MonitoramentoOferta.delete');
    var query = {
        sql: 'delete from MonitoramentoOferta WHERE MonitoramentoOferta.deleted=1',
    };
    console.log('vou executar a query remocao');
    context.data.execute(query).then(function (result) {
        console.log('deletei');        
    });
    return '';
});

module.exports = table;

//var table = module.exports = require('azure-mobile-apps').table();

var azureMobileApps = require('azure-mobile-apps'),
    promises = require('azure-mobile-apps/src/utilities/promises'),
    logger = require('azure-mobile-apps/src/logger');

var azure = require('azure-sb');
var table = azureMobileApps.table();
table.softDelete = false;

var notificationHubService = azure.createNotificationHubService('goodbuy-push', 'Endpoint=sb://goodbuy.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=6KUDiCOPb5sNJBlAjvdaOjyc4/f//2yasT8+o2vTxFc=');

function updateTagInstallation(installation, participante, nomeGrupo) {
    var novaTag = participante.idGrupoOferta;
    var index = installation.tags.indexOf(novaTag);
    console.log('index', index);
    console.log('chegaa', participante);
    var message = '';
    var key = '';
    if (index === -1) { //inserir nova tag
        installation.tags.push(novaTag);
        key = '703';
        message = `${participante.idUser} é um novo membro do grupo de ofertas ${nomeGrupo}`;
    } else {
        key = '704';
        message = `Um membro saiu do grupo de ofertas ${nomeGrupo}`;
        installation.tags = installation.tags.filter(x => x !== novaTag);

        var payload = {
            data: {
                key,
                message: `Você foi removido do grupo de ofertas ${nomeGrupo}`,
            }
        };
        console.log('vou enviar p user', `user:${participante.idUser}`, message, installation);
        notificationHubService.gcm.send(
            `user:${participante.idUser}`,
            payload, function (error) {
                if (!error) {
                    //notification sent
                }
            });
    }

    notificationHubService.createOrUpdateInstallation(installation,(error, result) => {
        var payload = {
            data: {
                key,
                message,
            }
        };
        console.log('vou enviar', novaTag, payload, installation);
        notificationHubService.gcm.send(novaTag, payload, function (error) {
            if (!error) {
                //notification sent
            }
        });
    });
}


table.insert(function (context) {
    logger.info('Running PARTICIPANTE.insert');
      // notificationHubService.deleteInstallation('d4136310-311f-4b8d-bfdb-12de18d432ce',(error, result) => console.log('OK'));
      // notificationHubService.deleteInstallation('c991ec4b-2a9d-45d0-8add-1f025c924433',(error, result) => console.log('OK'));
      // notificationHubService.listRegistrations((error, result) => console.log('listeners', result));


    var nomeGrupo = context.item.nomeGrupo;
    delete context.item.delete;
    delete context.item.nomeGrupo;
    var installationId = context.req.headers['x-zumo-installation-id'];
    notificationHubService.getInstallation(installationId,(error, result) => updateTagInstallation(result, context.item, nomeGrupo));
    return context.execute()
        .then(function (results) {
        if (context.push) {
        }
        return results;
    })
        .catch(function (error) {
        logger.error('Error while 2 running context.execute: ', error);
    });
});

table.update(function (context) {
    logger.info('Running ParticipanteGrupo.update');

    if (context.item.delete) {
        console.log('nomegr', context.item.nomeGrupo);
        var nomeGrupo = context.item.nomeGrupo;
        delete context.item.delete;
        delete context.item.nomeGrupo;
        var query = {
            sql: `update ParticipanteGrupo set deleted = 1
                  WHERE ParticipanteGrupo.Id =@Id`,
            parameters: [
                { name: 'Id', value: context.item.id },
            ],
        };
        console.log('executei');
       
        //     .then(function (results) {
        //     console.log('executei');
        //     return results;
        // }).catch(function (error) {
        //     logger.error('Error while 1 running context.execute: ', error);
        //});
    }
    return context.execute().then(function (results) {
        context.data.execute(query).then(function () {
            var installationId = context.req.headers['x-zumo-installation-id'];
            return notificationHubService.getInstallation(installationId,(error, result) => {
                return updateTagInstallation(result, context.item, nomeGrupo);
            });
        });
        if (context.push) {
        }
        return results;
    });
});

table.delete(function (context) {
    logger.info('Running ParticipanteGrupo.delete');
    var query = {
        sql: 'delete from ParticipanteGrupo WHERE ParticipanteGrupo.deleted=1',
    };
    var query2 = {
        sql: 'delete from GrupoOferta WHERE GrupoOferta.deleted=1',
    };
    console.log('vou executar a query remocao');
    context.data.execute(query).then(function (result) {
        console.log('deletei');
        context.data.execute(query2);
    });
    return '';
});

module.exports = table;

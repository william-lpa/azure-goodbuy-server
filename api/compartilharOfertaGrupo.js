var azure = require('azure-sb');
var notificationHubService = azure.createNotificationHubService('goodbuy-push', 'Endpoint=sb://goodbuy.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=6KUDiCOPb5sNJBlAjvdaOjyc4/f//2yasT8+o2vTxFc=');

module.exports = {
    post: function (request, response, next) {
        // Check for parameters - if not there, pass on to a later API call
        var title = request.body.title;
        var description = request.body.description;
        var tag = request.body.idGrupo;
        var idOferta = request.body.idOferta;

        var payload = {
            data: {
                key: '706',
                ofertaTitle: title,
                ofertaDescription: description,
                idOferta: idOferta
            }
        };

        console.log('body', payload);
        notificationHubService.gcm.send(tag, payload, function (error) {
            if (!error) {
                //notification sent
            }
        });
        response.json({ sent: 'OK' });
    },
    get: function (request, response, next) {
        console.log('body', "OK");
        return response.json({ sent: 'OK' });
    }
};

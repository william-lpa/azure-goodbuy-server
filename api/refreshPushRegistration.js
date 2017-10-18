var azure = require('azure-sb');
var notificationHubService = azure.createNotificationHubService('goodbuy-push', 'Endpoint=sb://goodbuy.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=6KUDiCOPb5sNJBlAjvdaOjyc4/f//2yasT8+o2vTxFc=');

module.exports = {
    post: function (request, response, next) {

        console.log('tags', request.body);

        var tags = request.body;
        var installationId = request.headers['x-zumo-installation-id'];
        //var installation;

        notificationHubService.getInstallation(installationId,(error, installation) => {
            //console.log('insta', installation);
            tags.forEach(function (tag) {
                var index = installation.tags.indexOf(tag);
                if (index === -1) { //inserir nova tag
                    installation.tags.push(tag);
                }
            }, this);
            console.log('RegistrationAtual', installation);
            notificationHubService.createOrUpdateInstallation(installation,(error, result) => { console.log('current', result); });
        });

        response.json({ sent: 'OK' });
    }
};

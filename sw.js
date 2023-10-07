self.addEventListener('push', function (event) {
    const options = {
        body: event.data.text(),
        icon: 'icon.png', // Replace with the path to your notification icon
    };

    event.waitUntil(
        self.registration.showNotification('Your Notification Title', options)
    );
});

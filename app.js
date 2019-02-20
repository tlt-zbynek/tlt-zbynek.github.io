document.getElementById('arduinoButton').addEventListener('click', function () {
    if (navigator.usb) {
        talkToArduino();
    } else {
        alert('WebUSB not supported.');
    }
});

async function talkToArduino() {
    try {
        let device = await navigator.usb.requestDevice({ filters: [{ vendorId: 0x2341 }] });
        await device.open(); // Begin a session.
        await device.selectConfiguration(1); // Select configuration #1 for the device.
        await device.claimInterface(2); // Request exclusive control over interface #2.
        await device.controlTransferOut({
            requestType: 'class',
            recipient: 'interface',
            request: 0x22,
            value: 0x01,
            index: 0x02
        });

        // Ready to receive data
        let result = device.transferIn(5, 64); // Waiting for 64 bytes of data from endpoint #5.
        let decoder = new TextDecoder();
        document.getElementById('target').innerHTML = 'Received: ' + decoder.decode(result.data);
    } catch (error) {
        document.getElementById('target').innerHTML = error;
    }
}

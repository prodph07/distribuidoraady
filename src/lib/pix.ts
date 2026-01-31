
// CRC16-CCITT implementation for Pix
function crc16ccitt(str: string) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        crc ^= c << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

interface PixKey {
    key: string;
    name: string;
    city: string;
    amount?: number;
    description?: string; // TXID
}

export function generatePixPayload({ key, name, city, amount, description = '***' }: PixKey): string {
    const formatField = (id: string, value: string) => {
        const len = value.length.toString().padStart(2, '0');
        return `${id}${len}${value}`;
    };

    // Sanitize
    const safeName = name.substring(0, 25).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const safeCity = city.substring(0, 15).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const safeAmount = amount ? amount.toFixed(2) : '0.00';

    let payload = [
        formatField('00', '01'), // Payload Format Indicator
        formatField('26', [ // Merchant Account Information
            formatField('00', 'BR.GOV.BCB.PIX'),
            formatField('01', key)
        ].join('')),
        formatField('52', '0000'), // Merchant Category Code
        formatField('53', '986'), // Transaction Currency (BRL)
        amount ? formatField('54', safeAmount) : '', // Transaction Amount
        formatField('58', 'BR'), // Country Code
        formatField('59', safeName), // Merchant Name
        formatField('60', safeCity), // Merchant City
        formatField('62', [ // Additional Data Field Template
            formatField('05', description) // Reference Label (TXID)
        ].join(''))
    ].join('');

    // Append CRC16 ID
    payload += '6304';

    // Calculate CRC
    payload += crc16ccitt(payload);

    return payload;
}

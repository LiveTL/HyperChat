/**
 * Only translates from JP to EN. For it to work, you need to install and run Sugoi Translator server on your local machine
 */
export class SugoiTranslatorOffline {
    translate(text: string) : Promise<string> {
        const SugoiHost = '127.0.0.1'
        const SugoiPort = 14366
        const SugoiPath = ''

        return fetch(`http://${SugoiHost}:${SugoiPort}/${SugoiPath}`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                message: 'translate sentences',
                content: text
            })
        }).then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            return response.json() as Promise<string>;
        });
    }
}

export function copyToClipboard(str: string): boolean {
    if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
        const textarea = document.createElement('textarea');
        textarea.textContent = str;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand('copy');
        } catch (ex) {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
    return false;
}

/* eslint-disable */
function copyUrl() {
    const itemToCopy = document.getElementById('urlCustom');
    const url = itemToCopy.innerText.split('\n')[1];
    const textarea = document.createElement('textarea');

    itemToCopy.appendChild(textarea);
    textarea.innerText = url;
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    document.execCommand("copy");
    itemToCopy.removeChild(textarea);

    alert(`Copied url: ${textarea.value}`);
}

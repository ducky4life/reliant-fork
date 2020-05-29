document.head.innerHTML = '<title>Reliant</title><meta charset="utf-8">';

const pageContent = document.createElement('div');
pageContent.id = "content";
pageContent.innerHTML = `
<div id="group1">
    <input type="button" id="update-localid" value="Update Localid">
    
    <!-- Status -->
    <div id="status-container">
    <span id="status-header" class="header">Status</span>
    <br>
    <br>
    <span id="status" class="information">N/A</span>
    </div>


    <!-- Current WA Nation -->
    <div id="current-wa-nation-container">
    <span id="current-wa-nation-header" class="header">Current WA Nation</span>
    <br>
    <input type="button" id="resign" value="Resign" class="ajaxbutton">
    <input type="button" id="admit" value="Admit on Next Switcher" class="ajaxbutton">
    <br>
    <span id="current-wa-nation" class="information">N/A</span>
    </div>
</div>

<div id="group2">
    <!-- Endorsing -->
    <div id="endorse-container">
        <span id="endorse-header" class="header">Endorse</span>
        <br>
        <input type="button" id="refresh-endorse" value="Refresh" class="ajaxbutton">
        <br>
        <br>
        <div class="information">
            <ul id="nations-to-endorse">
            </ul>
        </div>
    </div>
    
    <!-- Dossier -->
    <div id="dossier-container">
        <span id="dossier-header" class="header">Dossier</span>
        <br>
        <input type="button" id="refresh-dossier" value="Refresh" class="ajaxbutton">
        <div>
            <label for="raider-jp">Raider Jump Point</label>
            <input type="text" id="raider-jp">
            <input type="button" id="set-raider-jp" value="Set">
        </div>
        <div class="information">
            <ul id="nations-to-dossier">
            </ul>
        </div>
    </div>
</div>

<div id="group3">
    <!-- Chasing -->
    <div id="chasing-container">
        <span id="chasing-header" class="header">Chasing</span>
        <br>
        <input type="button" id="move-to-jp" value="Move to JP" class="ajaxbutton">
        <input type="button" id="chasing-button" value="Refresh" class="ajaxbutton">
    </div>
</div>

<div id="group4">
    <!-- Switchers -->
    <div id="switchers-container">
        <span id="switchers-container" class="header">Switchers Left</span>
        <br>
        <div class="information">
            <ul id="switchers">
            </ul>
        </div>
    </div>
</div>
`;

document.body.appendChild(pageContent);

/*
 * Dynamic Information
 */

const status: HTMLElement = document.querySelector("#status");
const currentWANation: HTMLElement = document.querySelector("#current-wa-nation");
const nationsToEndorse: HTMLElement = document.querySelector("#nations-to-endorse");
const nationsToDossier: HTMLElement = document.querySelector("#nations-to-dossier");
const switchers: HTMLElement = document.querySelector("#switchers");

/*
 * Helpers
 */

function resetSwitchers(switcherList: string[]): void
{
    const toAdd = Object.keys(switcherList);
    switchers.innerHTML = '';
    for (let i = 0; i != toAdd.length; i++)
        switchers.innerHTML += `<li>${toAdd[i]}</li>`;
}

function makeAjaxQuery(url: string, method: string, data: object): string
{
    return new Promise((resolve, reject) => {
        function onLoadStart(e: Event): void
        {
            document.querySelectorAll('.ajaxbutton').forEach(node => {
                node.disabled = true;
            });
        }

        async function onLoadEnd(e: Event): void
        {
            document.querySelectorAll('.ajaxbutton').forEach(node => {
                node.disabled = false;
            });
            resolve(xhr.response);
        }

        let xhr = new XMLHttpRequest();
        xhr.addEventListener("loadstart", onLoadStart);
        xhr.addEventListener("loadend", onLoadEnd);
        xhr.open(method, url);
        xhr.responseType = "text";
        if (data !== undefined)
            xhr.send(data);
        else
            xhr.send();
    });
}

async function manualLocalIdUpdate(e: MouseEvent): void
{
    console.log('manually updating localid');
    let response = await makeAjaxQuery('/region=rwby', 'GET');
    getLocalId(response);
    status.innerHTML = 'Updated localid.';
}

/*
 * Event Handlers
 */

function resignWA(e: MouseEvent): void
{
    chrome.storage.local.get('chk', async (result) => {
        const chk = result.chk;
        let formData = new FormData();
        formData.set('action', 'leave_UN');
        formData.set('chk', chk);
        const response = await makeAjaxQuery("/page=UN_status", "POST", formData);
        if (response.indexOf('You inform the World Assembly that') !== -1) {
            currentWANation.innerHTML = 'N/A';
            const nationNameRegex = new RegExp('<body id="loggedin" data-nname="([A-Za-z0-9_]+?)">');
            const match = nationNameRegex.exec(response);
            status.innerHTML = `Resigned from the WA on ${match[1]}`;
        }
    });
}

function admitWA(e: MouseEvent): void
{
    chrome.storage.local.get('switchers', async (result) => {
        let storedSwitchers = result.switchers;
        let switcherNames = Object.keys(storedSwitchers);
        let selectedSwitcher = switcherNames[0];
        let formData = new FormData();
        formData.set('nation', selectedSwitcher);
        formData.set('appid', storedSwitchers[selectedSwitcher]);
        let response = await makeAjaxQuery("/cgi-bin/join_un.cgi", "POST", formData);
        if (response.indexOf("Welcome to the World Assembly, new member") !== -1) {
            currentWANation.innerHTML = pretty(selectedSwitcher);
            status.innerHTML = `Admitted to the WA on ${selectedSwitcher}.`;

            // Update Chk
            const chkRegex: RegExp = new RegExp(`<input type="hidden" name="chk" value="([A-Za-z0-9]+?)">`);
            const match = chkRegex.exec(response);
            const chk = match[1];
            chrome.storage.local.set({'chk': chk});
            console.log(`chk set to ${chk}`);
        }
        else
            status.innerHTML = `Error admitting to the WA on ${selectedSwitcher}.`;
        delete storedSwitchers[selectedSwitcher];
        chrome.storage.local.set({"switchers": storedSwitchers});
    });
}

function refreshEndorse(e: MouseEvent): void
{
    nationsToEndorse.innerHTML = '';
    chrome.storage.local.get('jumppoint', async (result) => {
        const jumpPoint = result.jumppoint;
        let response = await makeAjaxQuery(`/page=ajax2/a=reports/view=region.${jumpPoint}/filter=move+member+endo`,
        'GET');
        let div = document.createElement('div');
        div.innerHTML = response;
        let lis = div.querySelectorAll('li');
        let resigned: string[] = [];
        for (let i = 0; i != lis.length; i++) {
            const nationNameRegex = new RegExp('nation=([A-Za-z0-9_]+)');
            const nationNameMatch = nationNameRegex.exec(lis[i].querySelector('a:nth-of-type(1)').href);
            const nationName = nationNameMatch[1];
            // Don't include nations that probably aren't in the WA
            if (lis[i].innerHTML.indexOf('resigned from') !== -1)
                resigned.push(nationName);
            else if (lis[i].innerHTML.indexOf('was admitted') !== -1) {
                if (resigned.indexOf(nationName) === -1) {
                    function onEndorseClick(e: MouseEvent)
                    {
                        console.log('doing endorse click');
                        chrome.storage.local.get('localid', async (localidresult) => {
                            const localId = localidresult.localid;
                            let formData = new FormData();
                            formData.set('nation', nationName);
                            formData.set('localid', localId);
                            formData.set('action', 'endorse');
                            let endorseResponse = await makeAjaxQuery('/cgi-bin/endorse.cgi', 'POST', formData);
                            if (endorseResponse.indexOf('Failed security check.') !== -1)
                                status.innerHTML = `Failed to endorse ${nationName}.`;
                            else
                                status.innerHTML = `Endorsed ${nationName}.`;
                        });
                    }

                    let endorseButton: Element = document.createElement('input');
                    endorseButton.setAttribute('type', 'button');
                    endorseButton.setAttribute('class', 'ajaxbutton');
                    endorseButton.setAttribute('value', `Endorse ${pretty(nationName)}`);
                    endorseButton.addEventListener('click', onEndorseClick);
                    let endorseLi = document.createElement('li');
                    endorseLi.appendChild(endorseButton);
                    nationsToEndorse.appendChild(endorseLi);
                }
            }
        }
    });
}

function refreshDossier(e: MouseEvent): void
{

}

function setRaiderJP(e: MouseEvent): void
{
    const newRaiderJP = canonicalize(document.querySelector("#raider-jp").value);
    chrome.storage.local.set({"raiderjp": newRaiderJP});
}

function moveToJP(e: MouseEvent): void
{

}

function chasingButton(e: MouseEvent): void
{

}

function onStorageChange(changes: object, areaName: string): void
{
    for (let key in changes) {
        let storageChange = changes[key];
        if (key == "switchers") {
            const newSwitchers: string[] = storageChange.newValue;
            resetSwitchers(newSwitchers);
            break;
        }
    }
}

/*
 * Event Listeners
 */

document.querySelector("#resign").addEventListener("click", resignWA);
document.querySelector("#admit").addEventListener("click", admitWA);
document.querySelector("#refresh-endorse").addEventListener("click", refreshEndorse);
document.querySelector("#refresh-dossier").addEventListener("click", refreshDossier);
document.querySelector("#set-raider-jp").addEventListener("click", setRaiderJP);
document.querySelector("#move-to-jp").addEventListener("click", moveToJP);
document.querySelector("#chasing-button").addEventListener("click", chasingButton);
document.querySelector("#update-localid").addEventListener('click', manualLocalIdUpdate);
chrome.storage.onChanged.addListener(onStorageChange);

/*
 * Initialization
 */

chrome.storage.local.get("switchers", (result) =>
{
    resetSwitchers(result.switchers);
});
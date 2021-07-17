import {addText, addChildElement, clear} from '../lib/dom.js';

const loadSeed = () => {
  if (window.localStorage.seed == undefined) {
    window.localStorage.seed = getRandomHex32();
  }
};

const saveSeed = () => {
  const seed = document.getElementById('seed').value;
  window.localStorage.seed = seed;
};

const addSeedHideShow = () => {
  const wrapperElt = document.getElementById('seedWrapper');
  const hideShowElt = addChildElement(wrapperElt, 'form', {
    'method': 'POST',
    'class': '',
    'onsubmit': 'return false;',
  });
  const showButtonElt = addChildElement(hideShowElt, 'button', {
    'id': 'seed-show',
    'type': 'button',
    'class': '',
    'onclick': 'return showSeed();',
  });
  addText(showButtonElt, 'Show Seed');
  const hideButtonElt = addChildElement(hideShowElt, 'button', {
    'id': 'seed-hide',
    'type': 'button',
    'class': '',
    'style': 'display:none',
    'onclick': 'return hideSeed();',
  });
  addText(hideButtonElt, 'Hide Seed');
  addChildElement(hideShowElt, 'br');
  addChildElement(hideShowElt, 'input', {
    'id': 'seed',
    'class': '',
    'type': 'text',
    'size': '66',
    'max_length': '64',
    'value': window.localStorage.seed,
    'style': 'display:none',
    'onchange': 'updateSeedAndAccountInfo(); return false;',
    'oninput': 'updateSeedAndAccountInfo(); return false;',
  });
  addChildElement(hideShowElt, 'div', {
    'id': 'seedError',
    'style': 'display:none',
    'class': 'selectable',
  });
};

const updateSeed = () => {
  const seedElt = document.querySelector('#seed');
  const seedErrorElt = document.querySelector('#seedError');
  const accountElt = document.querySelector('#account');
  const accountInfoElt = document.querySelector('#accountInfo');
  window.localStorage.seed = seedElt.value.trim();
  seedElt.value = window.localStorage.seed;
  saveSeed();
  try {
    const seed = window.localStorage.seed;
    window.bananocoinBananojs.getBananoAccountFromSeed(seed, seedIx);
  } catch (error) {
    console.trace(error);
    seedErrorElt.innerText = 'error:' + error.message;
    accountElt.innerText = 'seed error';
    accountInfoElt.innerText = 'seed error';
    return;
  }
};


const addAccountAndInfo = () => {
  const wrapperElt = document.getElementById('accountWrapper');
  addText(addChildElement(wrapperElt, 'h2'), 'Account');
  addChildElement(wrapperElt, 'div', {
    'id': 'account',
    'class': 'selectable',
  });
  const accountFormElt = addChildElement(wrapperElt, 'form', {
    'method': 'POST',
    'class': '',
  });

  addText(addChildElement(accountFormElt, 'h2'), 'Account Info');
  const updateAccountInfoElt = addChildElement(accountFormElt, 'button', {
    'id': 'update-account-info',
    'type': 'button',
    'class': '',
    'onclick': 'updateAccountInfo();return false;',
  });
  addText(updateAccountInfoElt, 'Refresh Account Info');
  addChildElement(accountFormElt, 'div', {
    'id': 'accountInfo',
    'class': 'selectable',
  });
};

window.updateSeedAndAccountInfo = () => {
  updateSeed();
  updateAccountInfo();
};

window.updateAccountInfo = async () => {
  const seed = window.localStorage.seed;
  const accountElt = document.querySelector('#account');
  const accountInfoElt = document.querySelector('#accountInfo');
  const seedErrorElt = document.querySelector('#seedError');
  window.bananocoinBananojs.setBananodeApiUrl(window.bananoApiUrl);
  clear(accountInfoElt);
  seedErrorElt.innerText = '';
  let account;
  try {
    account = await window.bananocoinBananojs.getBananoAccountFromSeed(seed, seedIx);
  } catch (error) {
    console.trace(error);
    seedErrorElt.innerText = 'error:' + error.message;
    accountElt.innerText = 'seed error';
    accountInfoElt.innerText = 'seed error';
    return;
  }
  accountElt.innerText = account;
  const representative = account;

  let innerText = '';
  const accountInfo = await window.bananocoinBananojs.getAccountInfo(account, true);
  if (accountInfo.error !== undefined) {
    innerText = accountInfo.error;
  } else {
    const balanceParts = await window.bananocoinBananojs.getBananoPartsFromRaw(accountInfo.balance);
    const balanceDescription = await window.bananocoinBananojs.getBananoPartsDescription(balanceParts);
    innerText = 'Balance ' + balanceDescription;

    if (balanceParts.raw == '0') {
      delete balanceParts.raw;
    }
  }
  const pending = await window.bananocoinBananojs.getAccountsPending([account], maxPending, true);
  if (pending.error !== undefined) {
    innerText += '\n';
    innerText += pending.error;
  }
  const pendingBlocks = pending.blocks[account];

  const hashes = [...Object.keys(pendingBlocks)];
  if (hashes.length !== 0) {
    const hash = hashes[0];
    const response = await window.bananocoinBananojs.receiveBananoDepositsForSeed(seed, seedIx, representative, hash);
    if (response.pendingMessage) {
      innerText += '\nPending ' + response.pendingMessage;
    }
    if (response.receiveMessage) {
      innerText += '\nReceive ' + response.receiveMessage;
    }
  }
  accountInfoElt.innerText = innerText;
};


export {loadSeed, addSeedHideShow, addAccountAndInfo};

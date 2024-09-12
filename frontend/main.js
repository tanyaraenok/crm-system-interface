(() => {
  const LOCALHOST_LINK = 'http://localhost:3000/api/clients';
  const LOCALE = 'ru-RU';
  const MAX_CONTACTS_PREVIEW_LENGTH = 5;
  const MAX_CONTACTS_QUANTITY = 10;
  const blockPointerEventsContainer = document.getElementById('block-pointer-events-container');
  const addNewClientButton = document.getElementById('clients__button_add-new-client');
  const clientsListBody = document.getElementById('clients__tbody');
  const loadingTableBody = document.getElementById('clients__tbody_loading');
  const clientSectionLoading = document.getElementById('client-section_loading');
  const newClientSection = document.getElementById('client-section_new');
  const newClientSectionSurnameInput = document.getElementById('client-form__input_surname');
  const newClientSectionNameInput = document.getElementById('client-form__input_name');
  const newClientSectionLastNameInput = document.getElementById('client-form__input_last-name');
  const newClientSectionPlaceholderSurname = document.getElementById('client-form__placeholder_surname');
  const newClientSectionPlaceholderName = document.getElementById('client-form__placeholder_name');
  const newClientSectionPlaceholderLastName = document.getElementById('client-form__placeholder_last-name');
  const newClientSectionAddContactButton = document.getElementById('client-form__add-contact-button_new-client');
  const newClientSectionAddContactGroup = document.getElementById('client-form__add-contact-group_new-client');
  const newClientSectionCloseButton = document.getElementById('client-form__close-button_new-client');
  const newClientSectionCancelButton = document.getElementById('client-form__cancel-button_new-client');
  const newClientSectionSaveButton = document.getElementById('client-form__save-button_new-client');
  const deleteClientSection = document.getElementById('client-section_delete');
  const deleteClientSectionDeleteButton = document.getElementById('delete-clients__button');
  const deleteClientSectionCloseButton = document.getElementById('delete-clients__close-button');
  const deleteClientSectionCancelButton = document.getElementById('delete-clients__cancel-button');
  const updateClientSection = document.getElementById('client-section_update');
  const updateClientFormID = document.getElementById('client-form__id_update');
  const updateClientSectionSurnameInput = document.getElementById('client-form__input_update_surname');
  const updateClientSectionNameInput = document.getElementById('client-form__input_update_name');
  const updateClientSectionLastNameInput = document.getElementById('client-form__input_update_last-name');
  const updateClientSectionAddContactButton = document.getElementById('client-form__add-contact-button_update');
  const updateClientSectionAddContactGroup = document.getElementById('client-form__add-contact-group_update');
  const updateClientSectionCloseButton = document.getElementById('client-form__close-button_update');
  const updateClientSectionDeleteButton = document.getElementById('client-form__delete-button_update');
  const updateClientSectionSaveButton = document.getElementById('client-form__save-button_update');
  const contactsGroupArray = document.getElementsByClassName('client-form__contact-group');
  const headerInput = document.getElementById('header__input');
  const newClientSectionEmptyNameError = document.getElementById('error__empty-name_new-client');
  const newClientSectionEmptySurnameError = document.getElementById('error__empty-surname_new-client');
  const newClientSectionEmptyContactError = document.getElementById('error__empty-contact_new-client');
  const newClientSectionErrorsList = document.getElementById('errors-list_new-client');
  const updateClientSectionEmptyNameError = document.getElementById('error__empty-name_update');
  const updateClientSectionEmptySurnameError = document.getElementById('error__empty-surname_update');
  const updateClientSectionEmptyContactError = document.getElementById('error__empty-contact_update');
  const updateClientSectionErrorsList = document.getElementById('errors-list_update');
  const serverErrorSection = document.getElementById('server-error-section');
  const serverErrorHeader = document.getElementById('server-error__header');
  const serverErrorSectionCloseButton = document.getElementById('server-error__close-button');


  const contactTypesMap = new Map([
    [
      'телефон',
      {
        name: 'Телефон',
        class: 'phone',
      }
    ], [
      'email',
      {
        name: 'Email',
        class: 'email',
      }
    ],
    [
      'vk',
      {
        name: 'VK',
        class: 'vk',
      }
    ], [
      'facebook',
      {
        name: 'Facebook',
        class: 'facebook',
      }
    ], [
      'другое',
      {
        name: 'Другое',
        class: 'other',
      }
    ],
  ]);


  document.addEventListener('click', (e) => {
    const coords = [e.pageX, e.pageY];

    console.log(`Point is ${coords[0]}, ${coords[1]}`);
  });

  //функции редактирования внешнего вида
  function formatText(text) {
    return text.replaceAll(' ', '').charAt(0).toUpperCase() + text.replaceAll(' ', '').substr(1).toLowerCase();
  }

  function newClientSectionPlaceholdersListeners(input, placeholder) {
    input.addEventListener('input', () => {
      placeholder.classList.toggle('hidden', input.value);
    })
  }

  [
    [newClientSectionSurnameInput, newClientSectionPlaceholderSurname],
    [newClientSectionNameInput, newClientSectionPlaceholderName],
    [newClientSectionLastNameInput, newClientSectionPlaceholderLastName],
  ].forEach(input => newClientSectionPlaceholdersListeners(...input));

  Array.from(document.getElementsByClassName('client-form__input')).forEach((input) => {
    input.addEventListener('input', (event) => event.target.classList.remove('invalid'));
  })

  function blockPointerEvents() {
    blockPointerEventsContainer.classList.add('pointer-events-none');
  }

  function unblockPoinerEvents() {
    blockPointerEventsContainer.classList.remove('pointer-events-none');
  }

  function loadContactGroupChangesObserver() {
    const mutationObserver = new MutationObserver((mutationRecords) => {
      mutationRecords.forEach(mutationRecord => {
        let contactsCount = mutationRecord.target.getElementsByClassName('client-form__contact-group').length;
        mutationRecord.target.classList.toggle('padding25', contactsCount);
        mutationRecord.target.querySelector('.client-form__add-contact-button').toggleAttribute('disabled', contactsCount >= MAX_CONTACTS_QUANTITY);
      }
      );
    });
    [newClientSectionAddContactGroup, updateClientSectionAddContactGroup].forEach(target => mutationObserver.observe(target, { childList: true }));
  }
  loadContactGroupChangesObserver();


  //сервер и отрисовка страницы
  let savedClientsArray = [];

  function showClientsListLoader() {
    clientsListBody.classList.add('hidden');
    loadingTableBody.classList.remove('hidden');
  }

  function hideClientsListLoader() {
    loadingTableBody.classList.add('hidden');
    clientsListBody.classList.remove('hidden');
  }

  function showClientSectionLoader(section) {
    clientSectionLoading.classList.remove('hidden');
    section.classList.add('pointer-events-none');
  }

  function hideClientSectionLoader(section) {
    clientSectionLoading.classList.add('hidden');
    section.classList.remove('pointer-events-none');
  }

  async function loadClientsFromServer() {
    const response = await fetch(LOCALHOST_LINK);
    return handleResponse(response);
  }

  function renderClientsFromServer() {
    showClientsListLoader();
    loadClientsFromServer()
      .then(clients => {
        savedClientsArray = clients;
        savedClientsArray.sort((a, b) => a.id - b.id);
        renderCliensTable(savedClientsArray);
      })
      .catch(error => {
        showServerErrorSection(error);
      })
      .finally(() => {
        hideClientsListLoader();
      })
  }

  async function handleResponse(response) {
    let responseJson = await response.json();
    if (!response.ok) {
      throw new Error(
        `An error has occured: ${response.status}` + (Object.hasOwn(responseJson, 'message') ? ` - ${responseJson.message}` : '')
      );
    }
    return responseJson;
  }

  async function saveClientOnServer(client) {
    const response = await fetch(LOCALHOST_LINK, {
      method: 'POST',
      body: JSON.stringify(client),
      headers: {
        'Content-Type': 'application/json',
      }
    })
    return handleResponse(response);
  }

  async function updateClientOnServer(client) {
    const response = await fetch(`${LOCALHOST_LINK}/${client.id}`, {
      method: 'PATCH',
      body: JSON.stringify(client),
      headers: {
        'Content-Type': 'application/json',
      }
    })
    return handleResponse(response);
  }

  async function deleteClientFromServer(clientId) {
    const response = await fetch(`${LOCALHOST_LINK}/${clientId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  }

  async function getClientFromServer(clientId) {
    const response = await fetch(`${LOCALHOST_LINK}/${clientId}`, {
      method: 'GET',
    });
    return handleResponse(response);
  }

  function openClientLink(clientId) {
    if (!Boolean(clientId)) {
      return;
    }
    getClientFromServer(clientId)
      .then(client => {
        if (Object.hasOwn(client, 'id')) {
          showUpdateClientSection(client);
        }
      })
      .catch(error => {
        showServerErrorSection(error);
      })
  }

  function renderClientsFromServerAfterDeletion() {
    deleteClientFromServer(deleteClientSection.dataset.id)
      .then(renderClientsFromServer)
      .catch(error => {
        showServerErrorSection(error);
      });
    closeDeleteClientSection();
  }

  function createClientRow(client) {
    const clientRow = document.createElement('tr');
    clientRow.classList.add('client');
    clientRow.id = `client-${client.id}`;

    const clientIdTh = document.createElement('td');
    clientIdTh.classList.add('client__th', 'client__th_id');
    clientIdTh.innerText = client.id;

    const clientFullNameTh = document.createElement('td');
    clientFullNameTh.classList.add('client__th', 'client__th_fullname');
    clientFullNameTh.innerText = formatText(client.surname) + ' ' + formatText(client.name) + ' ' + formatText(client.lastName);

    const clientCreatedAtTh = document.createElement('td');
    clientCreatedAtTh.classList.add('client__th', 'client__th_created');

    const clientcreatedAtDate = document.createElement('div');
    clientcreatedAtDate.classList.add('client__th_created-date');
    clientcreatedAtDate.innerText = new Date(client.createdAt).toLocaleDateString(LOCALE);

    const clientcreatedAtTime = document.createElement('div');
    clientcreatedAtTime.classList.add('client__th_created-time');
    clientcreatedAtTime.innerText = new Date(client.createdAt).toLocaleTimeString(LOCALE, { timeStyle: 'short' });

    clientCreatedAtTh.append(clientcreatedAtDate, clientcreatedAtTime);

    const clientUpdatedAtTh = document.createElement('td');
    clientUpdatedAtTh.classList.add('client__th', 'client__th_updated');

    const clientupdatedAtDate = document.createElement('div');
    clientupdatedAtDate.classList.add('client__th_updated-date');
    clientupdatedAtDate.innerText = new Date(client.updatedAt).toLocaleDateString(LOCALE);

    const clientupdatedAtTime = document.createElement('div');
    clientupdatedAtTime.classList.add('client__th_updated-time');
    clientupdatedAtTime.innerText = new Date(client.updatedAt).toLocaleTimeString(LOCALE, { timeStyle: 'short' });

    clientUpdatedAtTh.append(clientupdatedAtDate, clientupdatedAtTime);

    const clientContactsTh = document.createElement('td');
    clientContactsTh.classList.add('client__th', 'client__th_contacts');

    clientContactsTh.append(renderClientContacts(client));

    const clientActionsTh = document.createElement('td');
    clientActionsTh.classList.add('client__th', 'client__th_actions');


    const updateButton = document.createElement('button');
    updateButton.classList.add('client__update-button');
    updateButton.innerText = 'Изменить';

    updateButton.addEventListener('click', () => {
      openUpdateClientSectionLoading();
      getClientFromServer(client.id)
        .then(client => {
          showUpdateClientSection(client);
        })
        .catch(error => {
          showServerErrorSection(error);
        })
        .finally(() => {
          closeUpdateClientSectionLoading();
        })
    });

    const updateButtonLoading = document.createElement('div');
    updateButtonLoading.classList.add('client__update-button-loading-div', 'hidden');
    updateButton.append(updateButtonLoading);

    function openUpdateClientSectionLoading() {
      updateButton.classList.add('client__update-button-loading');
      updateButtonLoading.classList.remove('hidden');
      blockPointerEvents();
    }

    function closeUpdateClientSectionLoading() {
      updateButton.classList.remove('client__update-button-loading');
      updateButtonLoading.classList.add('hidden');
    }

    clientActionsTh.append(updateButton);

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('client__delete-button');
    deleteButton.innerText = 'Удалить';

    deleteButton.addEventListener('click', () => {
      showDeleteClientSection(client.id);
    })

    clientActionsTh.append(deleteButton);

    const clientCopyLinkTh = document.createElement('td');
    clientCopyLinkTh.classList.add('client__th', 'client__th_copy-link');

    const copyClientLink = document.createElement('button');
    copyClientLink.classList.add('client__copy-link');

    const copyClientLinkHover = document.createElement('p');
    copyClientLinkHover.classList.add('client__copy-link-hover');
    copyClientLinkHover.innerText = 'Копировать';
    copyClientLink.append(copyClientLinkHover);

    const copyClientLinkDone = document.createElement('p');
    copyClientLinkDone.classList.add('client__copy-link-done', 'hidden');
    copyClientLinkDone.innerText = 'Готово';
    copyClientLink.append(copyClientLinkDone);

    let url = new URL(window.location);
    url.hash = client.id;
    copyClientLink.addEventListener('click', () => {
      navigator.clipboard.writeText(url.href);
      copyClientLinkDone.classList.remove('hidden');
      let timeout;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        copyClientLinkDone.classList.add('hidden');
      }, 1000);
    })

    clientCopyLinkTh.append(copyClientLink);

    clientRow.append(clientIdTh, clientFullNameTh, clientCreatedAtTh, clientUpdatedAtTh, clientContactsTh, clientActionsTh, clientCopyLinkTh);

    return clientRow;
  }

  function renderClientContacts(client) {
    const clientContactsList = document.createElement('ul');
    clientContactsList.classList.add('client__contacts-list', 'flex');

    client.contacts.forEach(contact => {
      const contactItem = document.createElement('li');
      contactItem.classList.add('client__contact-item');
      contactItem.setAttribute('data-id', client.id);

      const contactTypeClass = contactTypesMap.get(contact.type.toLowerCase())?.class;

      contactItem.classList.add(`client__contact-item_${contactTypeClass}`);

      const contactLink = document.createElement('a');
      contactLink.classList.add('client__contact-link');
      contactLink.innerHTML = contact.value;

      const contactHoverParagraph = document.createElement('p');
      contactHoverParagraph.classList.add('client__contact-item-hover', 'flex');
      contactHoverParagraph.innerText = contact.value;

      const contactHoverSpan = document.createElement('span');
      contactHoverSpan.classList.add('client__contact-hover-span');
      contactHoverSpan.innerText = contact.type + ':';

      contactHoverParagraph.prepend(contactHoverSpan);
      contactLink.append(contactHoverParagraph);
      contactItem.append(contactLink);
      clientContactsList.append(contactItem);
    });

    if (client.contacts.length > MAX_CONTACTS_PREVIEW_LENGTH) {
      const showContactsButton = document.createElement('li');
      showContactsButton.innerText = '+6';
      showContactsButton.classList.add('client__contact-show-contacts-button');
      showContactsButton.addEventListener('click', (event) => {
        for (contact of event.target.parentElement.getElementsByClassName('client__contact-item')) {
          contact.classList.remove('hidden');
        }
        event.target.classList.add('hidden');
      });
      clientContactsList.append(showContactsButton);

      Array
        .from(showContactsButton.parentElement.getElementsByClassName('client__contact-item'))
        .slice(MAX_CONTACTS_PREVIEW_LENGTH - 1)
        .forEach(contact => contact.classList.add('hidden'));
    }

    return clientContactsList;
  }

  function renderCliensTable(clientsArray) {
    clientsListBody.replaceChildren('');
    clientsArray.forEach(client => {
      clientsListBody.append(createClientRow(client));
    });
  }

  window.addEventListener("hashchange", event => handleUrlHash(event.newURL), false);

  function handleUrlHash(url) {
    newHash = new URL(url).hash;
    if (newHash.includes('client')) {
      return;
    }
    openClientLink(newHash.replace('#', ''));
  }

  addNewClientButton.addEventListener('click', (event) => {
    event.preventDefault();
    showNewClientSection();
  })

  renderClientsFromServer();
  handleUrlHash(window.location);


  //функции отображения секций
  function showDeleteClientSection(clientId) {
    deleteClientSection.classList.remove('hidden');
    deleteClientSection.setAttribute('data-id', clientId);
    deleteClientSectionDeleteButton.focus();
    blockPointerEvents();
  }

  function showUpdateClientSection(client) {
    updateClientSection.classList.remove('hidden');
    updateClientSection.setAttribute('data-id', client.id);
    updateClientFormID.innerText = `ID: ${client.id}`;
    updateClientSectionSurnameInput.value = client.surname;
    updateClientSectionNameInput.value = client.name;
    updateClientSectionLastNameInput.value = client.lastName;
    updateClientSectionSurnameInput.focus();
    blockPointerEvents();
    client.contacts.forEach((contact) => {
      updateClientSectionAddContactButton.before(createNewContactForm(contact));
    })
  }

  function showNewClientSection() {
    newClientSection.classList.remove('hidden');
    newClientSectionSurnameInput.focus();
    blockPointerEvents();
  }

  function getContactsArray() {
    return Array.from(document.getElementsByClassName('client-form__contact-group')).map((contactGroup) => {
      return {
        value: contactGroup.querySelector('.client-form__contact-input')?.value,
        type: contactGroup.querySelector('.client-form__contact-select-button')?.innerText,
      }
    });
  }

  function showServerErrorSection(error) {
    serverErrorSection.classList.remove('hidden');
    serverErrorHeader.innerHTML = error.message;
  }

  function hideServerErrorSection() {
    serverErrorSection.classList.add('hidden');
  }

  //функции закрытия секций 
  function closeClientSection(clientSection) {
    newClientSectionSurnameInput.value = '';
    newClientSectionNameInput.value = '';
    newClientSectionLastNameInput.value = '';
    newClientSectionPlaceholderSurname.classList.remove('hidden');
    newClientSectionPlaceholderName.classList.remove('hidden');
    newClientSectionPlaceholderLastName.classList.remove('hidden');
    Array.from(contactsGroupArray).forEach((item) => {
      item.remove();
    });
    clientSection.classList.add('hidden');
    unblockPoinerEvents();
  }

  function closeDeleteClientSection() {
    deleteClientSection.classList.add('hidden');
    unblockPoinerEvents();
  }

  //слушатели событий формы нового контакта
  newClientSectionCloseButton.addEventListener('click', (event) => {
    event.preventDefault();
    closeClientSection(newClientSection);
  })

  newClientSectionCancelButton.addEventListener('click', (event) => {
    event.preventDefault();
    closeClientSection(newClientSection);
  })

  newClientSectionAddContactButton.addEventListener('click', (event) => {
    event.preventDefault();
    newClientSectionAddContactButton.before(createNewContactForm());
  })

  newClientSectionSaveButton.addEventListener('click', (event) => {
    event.preventDefault();

    const client = {
      name: formatText(newClientSectionNameInput.value),
      surname: formatText(newClientSectionSurnameInput.value),
      lastName: formatText(newClientSectionLastNameInput.value),
      createdAt: new Date(),
      updatedAt: new Date(),
      contacts: getContactsArray(),
    }

    if (validation(client, newClientSection, newClientSectionEmptyNameError, newClientSectionEmptySurnameError, newClientSectionEmptyContactError, newClientSectionErrorsList, newClientSectionNameInput, newClientSectionSurnameInput)) {
      showClientSectionLoader(newClientSection);
      saveClientOnServer(client)
        .then(function (storedClient) {
          savedClientsArray.push(storedClient);
          renderCliensTable(savedClientsArray);
          closeClientSection(newClientSection);
        })
        .catch(error => {
          showServerErrorSection(error);
        })
        .finally(() => {
          hideClientSectionLoader(newClientSection);
        });
      addNewClientButton.focus();
    }
    else return;
  })

  //слушатели событий формы изменения контакта
  updateClientSectionCloseButton.addEventListener('click', (event) => {
    event.preventDefault();
    closeClientSection(updateClientSection);
  })

  updateClientSectionDeleteButton.addEventListener('click', () => {
    closeClientSection(updateClientSection);
    showDeleteClientSection(updateClientSection.dataset.id);
  })

  updateClientSectionAddContactButton.addEventListener('click', (event) => {
    event.preventDefault();
    updateClientSectionAddContactButton.before(createNewContactForm());
  })

  updateClientSectionSaveButton.addEventListener('click', (event) => {
    event.preventDefault();

    let client = savedClientsArray.find(client => client.id == updateClientSection.dataset.id);
    if (!client) {
      return;
    }

    client.surname = formatText(updateClientSectionSurnameInput.value);
    client.name = formatText(updateClientSectionNameInput.value);
    client.lastName = formatText(updateClientSectionLastNameInput.value);
    client.updatedAt = new Date;
    client.contacts = getContactsArray();
    if (validation(client, updateClientSection, updateClientSectionEmptyNameError, updateClientSectionEmptySurnameError, updateClientSectionEmptyContactError, updateClientSectionErrorsList, updateClientSectionNameInput, updateClientSectionSurnameInput)) {
      showClientSectionLoader(updateClientSection);
      updateClientOnServer(client)
        .then(() => {
          renderCliensTable(savedClientsArray);
          closeClientSection(updateClientSection);
        })
        .catch(error => {
          showServerErrorSection(error);
        })
        .finally(() => {
          hideClientSectionLoader(updateClientSection);
        })
    }

  })

  //слушатели событий формы удаления клиента
  deleteClientSectionDeleteButton.addEventListener('click', () => {
    renderClientsFromServerAfterDeletion();
  })

  deleteClientSectionCloseButton.addEventListener('click', () => {
    closeDeleteClientSection();
  })

  deleteClientSectionCancelButton.addEventListener('click', () => {
    closeDeleteClientSection();
  })

  //слушатели событий формы Ошибки с сервера

  serverErrorSectionCloseButton.addEventListener('click', () => {
    hideServerErrorSection();
  });

  //работа с новыми контактами

  function hideContactsTypesList() {
    Array.from(document.getElementsByClassName('client-form__contacts-list')).forEach(contactsList => {
      contactsList.classList.add('hidden');
    })
    Array.from(document.getElementsByClassName('client-form__contact-select-button')).forEach(contactTypeSelectButton => {
      contactTypeSelectButton.classList.remove('client-form__contact-select-button-click');
    })
  }

  document.addEventListener('click', () => {
    hideContactsTypesList();
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab' || event.key === 'Escape') {
      hideContactsTypesList();
    }
  })

  function createNewContactForm(contact = null) {

    Array.from(document.getElementsByClassName('client-form__delete-contact-button')).pop()?.classList.remove('hidden');

    //Обертка для всей группы элементов нового контакта
    const newContactDiv = document.createElement('div');
    newContactDiv.classList.add('flex', 'client-form__contact-group');

    //Поле для введения контакта
    const newContactInput = document.createElement('input');
    newContactInput.classList.add('client-form__contact-input');
    newContactInput.placeholder = 'Введите данные контакта';
    newContactInput.type = 'text';
    newContactInput.value = contact?.value ?? '';
    newContactInput.addEventListener('input', (event) => {
      event.target.classList.remove('invalid');
    })

    //Обёртка для select и options
    const selectGroupDiv = document.createElement('div');
    selectGroupDiv.classList.add('client-form__select-group');

    //Select
    const contactTypeSelectButton = document.createElement('button');
    contactTypeSelectButton.classList.add('client-form__contact-select-button');
    contactTypeSelectButton.type = 'button';
    contactTypeSelectButton.innerText = contact?.type ?? 'Телефон';
    contactTypeSelectButton.addEventListener('keydown', (event) => {
      if (event.code === 'ArrowDown') {
        event.target.nextSibling.firstElementChild.focus();
      }
      if (event.code === 'ArrowUp') {
        event.target.nextSibling.lastElementChild.focus();
      }
    })
    contactTypeSelectButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      contactsList.classList.toggle('hidden');
      contactTypeSelectButton.classList.toggle('client-form__contact-select-button-click');
    });

    //Options
    const contactsList = document.createElement('ul');
    contactsList.classList.add('client-form__contacts-list', 'hidden');

    contactTypesMap.forEach(contactTypesMapItem => {
      const contactDOM = document.createElement('li');
      contactDOM.innerText = contactTypesMapItem.name;
      contactDOM.classList.add('client-form__contact-item');
      contactDOM.classList.add(`client-form__contact-item_${contactTypesMapItem.class}`);
      contactDOM.setAttribute('tabindex', '30');
      contactsList.append(contactDOM);
      contactDOM.addEventListener('keydown', (event) => {
        if (event.code === 'ArrowDown') {
          event.target.nextSibling ? event.target.nextSibling.focus() : contactTypeSelectButton.focus();
        }

        if (event.code === 'ArrowUp') {
          event.target.previousSibling ? event.target.previousSibling.focus() : contactTypeSelectButton.focus();
        }

        if (event.code === 'Enter') {
          event.preventDefault();
          selectContactType(contactDOM);
        }
      })
      contactDOM.addEventListener('click', (event) => {
        event.stopPropagation();
        selectContactType(contactDOM);
      })
    });

    function selectContactType(contactItem) {
      hideContactsTypesList();
      contactTypeSelectButton.innerText = contactItem.innerText;
      newContactInput.focus();
    }

    //Кнопка удаления контакта
    const deleteContactButton = document.createElement('button');
    deleteContactButton.classList.add('client-form__delete-contact-button');
    deleteContactButton.classList.toggle('hidden', !contact);

    deleteContactButton.type = 'button';
    deleteContactButton.addEventListener('click', () => {
      newContactDiv.remove();
    })

    //Обеспечиваем вложенность элементов
    selectGroupDiv.append(contactTypeSelectButton, contactsList);
    newContactDiv.append(selectGroupDiv, newContactInput, deleteContactButton);

    //При введении контакта появляется кнопка для удаления контакта
    newContactInput.addEventListener('change', () => {
      deleteContactButton.classList.remove('hidden');
    })

    return newContactDiv;
  }

  //сортировка

  function sort() {
    idOrderAsk = 1;
    fullNameOrderAsk = 1;
    createDateOrderAsk = 1;
    updateDateOrederAsk = 1;

    document.getElementById('clients__th_id').addEventListener('click', () => {
      savedClientsArray.sort((a, b) => a.id < b.id ? idOrderAsk : -1 * idOrderAsk);
      document.getElementById('clients__th_id').classList.toggle('clients__th_id-sorted');
      idOrderAsk *= -1;
      renderCliensTable(savedClientsArray);
    })

    document.getElementById('clients__th_fullname').addEventListener('click', () => {
      savedClientsArray.sort((a, b) => (a.surname + a.name + a.lastName).toLowerCase().trim() > (b.surname + b.name + b.lastName).toLowerCase().trim() ? fullNameOrderAsk : -1 * fullNameOrderAsk);
      document.getElementById('clients__th_fullname').classList.toggle('clients__th_fullname-sorted');
      fullNameOrderAsk *= -1;
      renderCliensTable(savedClientsArray);
    })

    document.getElementById('clients__th_created').addEventListener('click', () => {
      savedClientsArray.sort((a, b) => a.createdAt > b.createdAt ? createDateOrderAsk : -1 * createDateOrderAsk);
      document.getElementById('clients__th_created').classList.toggle('clients__th_created-sorted');
      createDateOrderAsk *= -1;
      renderCliensTable(savedClientsArray);
    })

    document.getElementById('clients__th_updated').addEventListener('click', () => {
      savedClientsArray.sort((a, b) => a.updatedAt > b.updatedAt ? updateDateOrederAsk : -1 * updateDateOrederAsk);
      document.getElementById('clients__th_updated').classList.toggle('clients__th_updated-sorted');
      updateDateOrederAsk *= -1;
      renderCliensTable(savedClientsArray);
    })

  }

  sort();

  //поиск
  async function search(event) {
    let url = new URL(LOCALHOST_LINK);
    url.searchParams.set('search', event.target.value);
    const response = await fetch(url.href);
    return await response.json();
  }

  let timeout;

  function createSearchResult(foundClientsArray) {
    hideSearchResults();

    const resultsList = document.createElement('ul');
    resultsList.classList.add('search-results-list');

    if (foundClientsArray.length) {
      foundClientsArray.forEach((result) => {
        const resultItem = document.createElement('li');
        resultItem.classList.add('search-results-list__item');

        const resultLink = document.createElement('a');
        resultLink.classList.add('search-results-list__link');
        resultLink.href = `#client-${result.id}`;
        resultLink.innerHTML = result.surname + ' ' + result.name + ' ' + result.lastName;
        resultLink.setAttribute('data-id', result.id);

        resultLink.addEventListener('keydown', (event) => {
          if (event.code === 'ArrowDown') {
            event.preventDefault();
            event.target.parentElement.nextSibling?.firstElementChild ? event.target.parentElement.nextSibling.firstElementChild.focus() : headerInput.focus();
          }

          if (event.code === 'ArrowUp') {
            event.preventDefault();
            event.target.parentElement.previousSibling?.firstElementChild ? event.target.parentElement.previousSibling.firstElementChild.focus() : headerInput.focus();
          }

          if (event.code === 'Escape') {
            event.preventDefault();
            hideSearchResults();
            headerInput.value = '';
          }
        })

        resultLink.addEventListener('click', (event) => {
          headerInput.value = event.target.innerHTML;
          hideSearchResults();

          document.querySelector(`#client-${event.target.dataset.id}`)?.classList.add('purple');
        })

        resultItem.append(resultLink);
        resultsList.append(resultItem);

        headerInput.after(resultsList);
      })
    }

    if (!headerInput.value || !foundClientsArray.length) {
      hideSearchResults();
    }
  }

  function hideSearchResults() {
    Array.from(document.getElementsByClassName('search-results-list')).forEach(element => {
      element.remove();
    });
    Array.from(document.getElementsByClassName('client')).forEach(client => {
      client.classList.remove('purple');
    })
  }

  headerInput.addEventListener('input', (event) => {
    showClientSectionLoader(blockPointerEventsContainer);
    clearTimeout(timeout);
    timeout = setTimeout(() => search(event)
      .then((foundClientsArray) => {
        hideSearchResults();
        createSearchResult(foundClientsArray);
      })
      .catch(error => {
        showServerErrorSection(error);
      })
      .finally(() => {
        hideClientSectionLoader(blockPointerEventsContainer);
      }), 500);
  })

  headerInput.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowDown') {
      event.preventDefault();
      event.target.nextSibling.firstElementChild.firstElementChild.focus();
    }
    if (event.code === 'ArrowUp') {
      event.preventDefault();
    }

    if (event.code === 'Escape') {
      hideSearchResults();
      headerInput.value = '';
    }

  })

  //валидация
  function validation(client, clientSection, emptyNameError, emptySurnameError, emptyContactError, errorsList, nameInput, surnameInput) {

    let isValidSurname = Boolean(client.surname);
    surnameInput.classList.toggle('invalid', !isValidSurname);
    emptySurnameError.classList.toggle('hidden', isValidSurname);

    let isValidName = Boolean(client.name);
    nameInput.classList.toggle('invalid', !isValidName);
    emptyNameError.classList.toggle('hidden', isValidName);

    let isValidContacts = true;
    if (client.contacts.length) {
      isValidContacts = !client.contacts.some((contact) => !contact.value.replaceAll(' ', ''));
      emptyContactError.classList.toggle('hidden', isValidContacts);

      Array.from(clientSection.getElementsByClassName('client-form__contact-input')).forEach(contact => {
        contact.classList.toggle('invalid', !contact.value.replaceAll(' ', ''));
      })
    }

    errorsList.classList.toggle('hidden', !(!isValidName || !isValidSurname || !isValidContacts));

    return (isValidName
      && isValidSurname
      && isValidContacts);
  }







})();
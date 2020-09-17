let db;
// creates a new db in the browser for budget db 
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = event => {
    const db = event.target.result;
    db.createObjectStore("pending", {autoIncrement : true});
};

request.onsuccess = event => {
    db = event.target.result;

    // here we check if the app is online before reading the browser's db
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = event => {
    console.log(`We have encountered an error: ${event.target.error}`);
};

const saveRecord = record => {
    //here we create a transaction on the pending database table with readwrite access
    const transaction = db.transaction(["pending"], "readwrite");

    //the  we access the pending object store
    const store = transaction.objectStore("pending");

    //the accessed record can be added to the store via the add method
    store.add(record);
};

const checkDatabase = () => {
    //open a transaction on the pending db
    const transaction = db.transaction(["pending"], "readwrite");
    //access the pending object store
    const store = transaction.objectStore("pending");
    //retrieve all records from the store and set them to a variable
    const getAll = store.getAll();

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(() => {
                //if successful, open a transaction on the pending db table
                const transaction = db.transaction(["pending"], "readwrite");
                //access the pending object store
                const store = transaction.objectStore("pending");
                //clear all items in the store
                store.clear();
            });
        }
    };
}

//listen for the app to come back online
window.addEventListener("online", checkDatabase);
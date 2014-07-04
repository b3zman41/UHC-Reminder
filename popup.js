
var notificationId = 0;

document.addEventListener('DOMContentLoaded', function() {

    init();

});

function updateTimeDifferenceForTimestamp(time) {

    var currentDate = new Date();

    return time - currentDate.getTime();
}

function getDateStringFromSeconds(seconds) {

    seconds /= 1000;

    //Add 60 seconds here so that the minutes doesn't look one lower becuase I remove seconds for legibility.
    seconds = Math.floor(seconds + 60);

    var days, hours, minutes, returnString = "";

    days = Math.floor(seconds / 86400);
    seconds -= 86400 * days;

    hours = Math.floor(seconds / 3600);
    seconds -= 3600 * hours;

    minutes = Math.floor(seconds / 60);
    seconds -= 60 * minutes;

    if (days) {
        returnString += "" + days + " days ";
    }

    if (hours) {
        returnString += "<br>" + hours + " hours";
    }

    if (minutes) {
        returnString += "<br>" + minutes + " min";
    }

    /*if (seconds) {
     returnString += "<br>" + parseInt(Math.ceil(seconds)) + " sec";
     }*/

    //Deletes the comma and space if it's the first thing.
    if (returnString.substring(0, 2) === ", ") {
        returnString = returnString.substring(2, returnString.length);
    }

    return returnString;
}

function getNextID() {

    notificationId++;

    chrome.storage.local.set({notificationID: notificationId}, function() {
    });

    console.log("ID : " + notificationId);

    return notificationId;

}

function addToTable(timeFrom, message, postObj) {
    var tablerow = document.createElement("tr");
    var tabledata1 = document.createElement("td");
    var tabledata2 = document.createElement("td");

    tablerow.onclick = function() {

        var currentID = getNextID().toString();

        chrome.notifications.create(currentID, {
            type: "basic",
            title: "UHC Scheduler",
            message: "Would you like to create a reminder for this match?",
            contextMessage: "Click me to bring to match post.",
            iconUrl: "icon.png",
            buttons: [{
                    title: "Yes."
                }, {
                    title: "No."
                }]
        }, function() {
            chrome.notifications.onClicked.addListener(function(id) {
                if (id === currentID) {
                    chrome.tabs.create({url: postObj.url});
                }
            });

            chrome.notifications.onButtonClicked.addListener(function(id, index) {
                if (index === 0 && id === currentID) {

                    var otherCurrentID = getNextID().toString();

                    chrome.notifications.create(otherCurrentID, {
                        type: "basic",
                        title: "At what time?",
                        message: "Choose from the available times below.",
                        iconUrl: "icon.png",
                        buttons: [{
                                title: "20 min"
                            }, {
                                title: "30 min"
                            }]
                    }, function() {
                        chrome.notifications.onButtonClicked.addListener(function(id, index) {

                            if (id === otherCurrentID) {

                                var delayTime = 0;

                                if (index === 0) {
                                    delayTime = 20;
                                } else if (index === 1) {
                                    delayTime = 30;
                                }

                                var postNotificationTimestamp = (postObj.time - delayTime * 60000) - new Date().getTime();
                                console.log("TIMESTAMP : " + postObj.time);
                                console.log("POST : " + postNotificationTimestamp);

                                var reminderCurrentID = getNextID().toString();

                                chrome.runtime.sendMessage("", {message: "notification", timeToWait: postNotificationTimestamp, postObj: postObj, id: reminderCurrentID});
                            }
                        });
                    });
                }
            });
        });
    };

    tabledata1.setAttribute("id", "key");
    tabledata2.setAttribute("id", "val");

    tablerow.setAttribute("id", "trmain");

    tabledata1.innerHTML = "<span><strong>" + timeFrom + "</strong></span>";
    tabledata2.innerHTML = "<span><strong>" + message + "</strong></span>";

    tablerow.appendChild(tabledata1);
    tablerow.appendChild(tabledata2);
    document.getElementById("maintable").appendChild(tablerow);
}

function pad(num) {
    if (num < 10) {
        return "0" + num;
    } else
        return "" + num;
}

function pushDataToTable() {
    var arrayCount = 0;

    chrome.storage.local.get("count", function(items) {
        arrayCount = items.count;
        console.log("Array Count : " + arrayCount);

        for (var i = 0; i < arrayCount; i++) {
            chrome.storage.local.get("match_" + i, function(items) {
                for (var k in items) {

                    var timeUntil = updateTimeDifferenceForTimestamp(items[k].time);

                    if (timeUntil > 0)
                        addToTable(getDateStringFromSeconds(timeUntil), items[k].title, items[k]);
                }
            });
        }
    });
}

function updateData() {
    chrome.storage.local.get("count", function(items) {
        arrayCount = items.count;
        console.log("Array Count : " + arrayCount);

        document.getElementById("currentTimeP").innerHTML = pad(new Date().getUTCHours()) + ":" + pad(new Date().getUTCMinutes()) + ":" + pad(new Date().getUTCSeconds());

        for (var i = 0; i < arrayCount; i++) {

            var currentIndex = 0;

            chrome.storage.local.get("match_" + i, function(items) {

                for (var k in items) {

                    console.log("I : " + i + ", K : " + k + ", current index : " + currentIndex);

                    var timeUntil = updateTimeDifferenceForTimestamp(items[k].time);

                    var table = document.getElementById("maintable");

                    var matchCurrentIndex = parseInt(k.split("_")[1]);

                    if (timeUntil >= 0) {
                        if (table.rows[currentIndex + 1]) {
                            table.rows[currentIndex + 1].cells[0].innerHTML = "<span><strong>" + getDateStringFromSeconds(timeUntil) + "</strong></span>";
                            table.rows[currentIndex + 1].cells[1].innerHTML = "<span><strong>" + items[k].title + "</strong></span>";
                        }
                    } else {

                        chrome.storage.local.remove("match_" + matchCurrentIndex, function() {
                            table.removeChild(table.rows[currentIndex + 1]);

                            chrome.storage.local.get("count", function(items) {
                                for (var someK in items) {
                                    console.log("Count : " + items[someK]);

                                    chrome.storage.local.set({count: items[somek]}, function() {
                                    });
                                }
                            });


                        });

                    }

                    currentIndex++;
                }
            });
        }
    });
}

function init() {

    chrome.storage.local.get("notificationID", function(item) {
        if (item.notificationID) {
            console.log("Notification ID : " + item.notificationID);
            notificationId = item.notificationID;
        }
    });

    pushDataToTable();

    updateData();

    setInterval(function() {
        updateData();

        document.getElementById("timeImg").style.webkitTransform = "scale(.5, .5)";

        setTimeout(function() {
            document.getElementById("timeImg").style.webkitTransform = "scale(.4, .4)";
        }, 500);
        //document.getElementById("timeImg").style.webkitTransform = "scale(1, 1)";
    }, 1000);

}

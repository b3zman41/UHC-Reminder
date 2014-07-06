function getMathces() {

    var maxPageCount = 10;
    var currentMatchCount = 0;
    var fullArray = [];

    var monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

//For Ids of links, use t3_{ID}
    var afterID;

    var numToGet;

    for (var pageCount = 0; pageCount < maxPageCount; pageCount++) {

        var currentPageJSON = "";
        var mainLink = "http://www.reddit.com/r/ultrahardcore/new.json?";

        if (afterID) {
            mainLink += "after=t3_" + afterID + "&";
        }

        numToGet = 100;

        mainLink += "limit=" + numToGet;

        var request = new XMLHttpRequest();
        request.open("GET", mainLink, false);
        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                console.log("URL : " + mainLink);
                parseResultsOfPage(request.responseText);
            }
        };

        request.send();

    }

    function parseResultsOfPage(results) {
        var fullJSON = JSON.parse(results);
        var jsonChildren = fullJSON.data.children;

        for (var i = 0; i < jsonChildren.length; i++) {

            var currentJSON = jsonChildren[i].data;

            if (currentJSON.link_flair_text === "Upcoming Match") {

                var titleSplitBySpaces = currentJSON.title.toString().split(" ");

                var month = monthAbbr.indexOf(titleSplitBySpaces[0]);
                var day = titleSplitBySpaces[1];

                if (titleSplitBySpaces[2]) {
                    var hours = titleSplitBySpaces[2].split(":")[0];
                    var minutes = titleSplitBySpaces[2].split(":")[1];
                }

                var currentDate = new Date();
                var postDate = new Date();

                postDate.setUTCFullYear(currentDate.getFullYear());
                postDate.setUTCMonth(month);
                postDate.setUTCDate(day);
                postDate.setUTCHours(hours);
                postDate.setUTCMinutes(minutes);
                postDate.setSeconds(00);

                var dateStuff = ("Month : " + postDate.getMonth() + ", Day : " + postDate.getDay() + ", Hours :" + postDate.getHours() + ", Minutes :" + postDate.getMinutes() + ", Post Date since unix : " + postDate.getTime() + ", current Date since unix : " + currentDate.getTime());

                var messageString = "";

                for (var j = titleSplitBySpaces.length - 1; j > 0; j--) {

                    if (titleSplitBySpaces[j] !== "UTC") {
                        messageString = titleSplitBySpaces[j] + " " + messageString;
                    } else {
                        j = 0;
                    }
                }

                var timeUntil = (postDate.getTime() / 1000 - currentDate.getTime() / 1000);
                var timeMessage = "";

                if (timeUntil > 60) {
                    timeMessage = parseInt((timeUntil / 60)) + " hrs and " + parseInt(timeUntil % 60) + " min";
                } else
                    timeMessage = timeUntil;


                if (month && day && hours && minutes && timeUntil > 0) {

                    fullArray[currentMatchCount] = {
                        time: postDate.getTime(),
                        timeUntil: timeUntil,
                        timeMessage: timeMessage,
                        title: messageString,
                        url: currentJSON.url,
                        dateStuff: dateStuff,
                        hour: postDate.getUTCHours(),
                        minutes: postDate.getUTCMinutes(),
                        id: currentJSON.id
                    };

                    currentMatchCount++;
                }

            }

            afterID = currentJSON.id.toString();
            console.log("After : " + afterID);
        }
    }

    fullArray.sort(function(a, b) {
        if (a.timeUntil < b.timeUntil)
            return -1;

        if (a.timeUntil > b.timeUntil)
            return 1;

        if (a.timeUntil === b.timeUntil)
            return 0;
    });

    return fullArray;
}

function pad(num){
    
    num = parseInt(num);
    
    if(num < 10){
        return "0" + num;
    }else return "" + num;
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.message === "notification") {

        console.log("Seconds to wait : " + parseInt(message.timeToWait));

        var map = {};
        if (!map["id_" + message.postObj.id])
            map["id_" + message.postObj.id] = {};

        map["id_" + message.postObj.id].scheduled = "true";

        chrome.storage.local.set(map, function() {
        });

        setTimeout(function() {
            chrome.notifications.create(message.id, {
                type: "basic",
                title: "UHC Reminder",
                message: message.postObj.title,
                contextMessage: "Game starts at " + pad(message.postObj.hour) + ":" + pad(message.postObj.minutes),
                iconUrl: "icon.png"
            }, function() {
                console.log("SHOWED REMINDER at " + new Date().getTime());
            });
        }, parseInt(message.timeToWait));
    }
});

var fullArray = getMathces();

chrome.storage.local.clear(function() {
});

/*fullArray.unshift({
 time: new Date().getTime() + 15000,
 timeUntil: 1,
 timeMessage: "THIS IS A FAKE MESSAGE",
 title: "THIS IS A FAKE TITLE",
 url: "http://www.google.com",
 dateStuff: "dateStuff",
 hour: new Date().getUTCHours(),
 minutes: new Date().getUTCMinutes()
 });*/

var storageObj = {};

for (var i = 0; i < fullArray.length; i++) {
    storageObj["match_" + i] = fullArray[i];
}

chrome.storage.local.set({count: fullArray.length}, function() {
});

chrome.storage.local.set(storageObj, function() {
});


chrome.alarms.create("", {
    periodInMinutes: 30
});

chrome.alarms.onAlarm.addListener(function(alarm) {

    setTimeout(function(){}, 0);
    console.log("RUNNING ALARM");

    var fullArray = getMathces();

    chrome.storage.local.clear(function() {
    });

    var storageObj = {};

    for (var i = 0; i < fullArray.length; i++) {
        storageObj["match_" + i] = fullArray[i];
    }

    chrome.storage.local.set({count: fullArray.length}, function() {
    });

    chrome.storage.local.set(storageObj, function() {
    });

});

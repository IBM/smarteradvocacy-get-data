// Copyright 2020 IBM Corp.

const express = require('express');
var request = require('request');
const timestamp = require('time-stamp');
const puppeteer = require('puppeteer');
var Twitter = require('twitter');

module.exports = function (app) {
  const router = express.Router();

  router.get('/', async function (req, res, next) {
    var runMode = req.query.runMode; console.log(runMode);
    var campaign = req.query.campaign; //console.log(campaign);
    var getDataType = req.query.getDataType; //console.log(getDataType)
    var uri = req.query.uri; //console.log(uri);
    var uriHash = req.query.uriHash; //console.log(uriHash);
    var uriParm1Key = req.query.parm1Key; //console.log(uriParm1Key);
    var uriParm1Value = req.query.parm1Value; //console.log(uriParm1Value);
    var githubUserAgent = req.query.githubUserAgent;
    if ( uriHash ) {
      uri=uri+"#"+uriHash
    } else if ( uriParm1Key ) {
      uri=uri+"?"+uriParm1Key+"="+uriParm1Value;
    }
    console.log(uri)

    function getEclipseMarketPlaceData(campaign, getDataType, uri) {
      return new Promise(resolve => {
        var uriPartFront = uri.split("/content/");
        var uriPart = uriPartFront[1].split("#");
        var artifact = uriPart[0];
        request({

          //uri: "https://marketplace.eclipse.org/content/codewind#group-metrics-tab",
          uri: uri,

        }, function(error,response,body){

            var bodyArray = body.split(/\r?\n/);
            var foundMetrics="no";
            var gotData;
            var dataCreatedTimestamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss');
            var jsonOutput = { campaign: campaign, getDataType: getDataType, artifact: artifact };
            jsonOutput.dataCreatedTimestamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss');
            jsonOutput.metrics={};
            monthNumber=0;
            for (i = 0; i < bodyArray.length; i++) { // find start of metrics data table in the html
                if ( bodyArray[i].includes("<thead><tr><th>Date</th><th>Ranking</th><th>Installs</th><th>Clickthroughs</th> </tr></thead>")) {
                    foundMetrics="yes";
                }
                if ( foundMetrics=="yes" ) {
                    if ( bodyArray[i].includes("</table>") ) {
                        foundMetrics="no";
                    } else {
                        if ( bodyArray[i].includes("thead") || bodyArray[i].includes("tbody")) { //ignore table header and body rows
                        } else {
                            // split string on <td>
                            gotData += bodyArray[i]+",";
                            var splitBody = bodyArray[i].split("<td>");
                            var month = splitBody[1].substring(0,splitBody[1].length-5);
                            var rankingData = splitBody[2].substring(0,splitBody[2].length-5);
                            var rankingDataPart = rankingData.split("/");
                            var rankingCurrentValue = rankingDataPart[0];
                            var rankingOfTotalPlugins = rankingDataPart[1];
                            var installsData = splitBody[3].substring(0,splitBody[3].length-5);
                            var installsDataPart = installsData.split(" ");
                            var installsCurrentValue = installsDataPart[0];
                            var percentageOfAllInstalls = installsDataPart[1].substring(1,installsDataPart[1].length-2);
                            var clickThroughs = splitBody[4].substring(0,splitBody[4].length-11);
                            var monthValue = monthNumber.toString();
                            var monthlyMetrics = { month: month, rankingCurrentValue: rankingCurrentValue, rankingOfTotalPlugins: rankingOfTotalPlugins, installsCurrentValue: installsCurrentValue, percentageOfAllInstalls: percentageOfAllInstalls, clickThroughs: clickThroughs };
                            jsonOutput.metrics[monthNumber] = monthlyMetrics;
                            //jsonOutput.month = month;
                            var monthNumber = monthNumber+1;
                        }
                    }
                }
            }
            //res.json(jsonOutput);
            resolve(jsonOutput);
            }
        );
      });
    }

    function getVSCodeMarketPlaceData(campaign, getDataType, uri) {
      return new Promise(resolve => {
        var uriPart = uri.split(".");
        var uriPartLength=uriPart.length
        var artifact = uriPart[uriPartLength-1]; // ASSUMEs 'uri' is the last parameter in query string (needs more code to make that not a req)
        request({

          //uri: "https://marketplace.eclipse.org/content/codewind#group-metrics-tab",
          uri: uri,

        }, function(error,response,body){

            var bodyArray = body.split(/\r?\n/);
            var foundMetrics="no";
            var gotData;
            var dataCreatedTimestamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss');
            var jsonOutput = { campaign: campaign, getDataType: getDataType, artifact: artifact};

            jsonOutput.dataCreatedTimestamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss');
            jsonOutput.metrics={};
            dataInstance=0;
            for (i = 0; i < bodyArray.length; i++) { // find start of metrics data table in the html
              if ( bodyArray[i].includes("statisticName")) {
                    //console.log(bodyArray[i]);
                    responseData = bodyArray[i];
                    //responseData = "hi";
                    var splitBody = bodyArray[i].split("statistics");
                    splitBody = splitBody[1].split(":");
                    for (j = 0; j < splitBody.length; j++) {
                      if ( splitBody[j].includes("}")) {
                        var splitValue = splitBody[j].split("}")
                        valueAsInteger = parseFloat(splitValue[0]);
                        if ( splitValue[0] != "\"\"" && splitValue[0] != 0 ) {
                          //var keyValuePair = { [splitKey[1]]: +splitValue[0] }
                          //console.log(splitKey[1]+": "+splitValue[0]);
                          if ( splitKey[1] == "install" ) {
                            jsonOutput.metrics.installs = valueAsInteger;
                          } else if ( splitKey[1] == "averagerating" ) {
                            jsonOutput.metrics.averagerating = valueAsInteger;
                          } else if ( splitKey[1] == "ratingcount" ) {
                            jsonOutput.metrics.ratingcount = valueAsInteger;
                          } else if ( splitKey[1] == "trendingmonthly" ) {
                            jsonOutput.metrics.trendingmonthly = valueAsInteger;
                          } else if ( splitKey[1] == "trendingweekly" ) {
                            jsonOutput.metrics.trendingweekly = valueAsInteger;
                          } else if ( splitKey[1] == "updateCount" ) {
                            jsonOutput.metrics.updateCount = valueAsInteger;
                          } else if ( splitKey[1] == "weightedRating" ) {
                            jsonOutput.metrics.weightedRating = valueAsInteger;
                        }
                          //jsonOutput.metrics.dataInstance = keyValuePair
                        }
                      } else {
                        var splitBodyStr = splitBody[j].replace(/\"/g,"--");
                        splitKey = splitBodyStr.split("--");
                      }
                    }
                } else if ( bodyArray[i].includes("installs</span>")) {
                  var splitBody = bodyArray[i].split("not including updates.");
                  splitBody = splitBody[1].split(" ");
                  //for (j = 0; j < splitBody.length; j++) {
                    splitBody[1] = splitBody[1].replace(/,/g, "");
                    var installAsInteger = parseInt(splitBody[1]);
                    jsonOutput.metrics.installs = installAsInteger;
                  //}
                  //splitBody = splitBody[7].split(" ");
                  //for (j = 0; j < splitBody.length; j++) {
                    var averageratingAsFloat = parseFloat(splitBody[8]);
                    jsonOutput.metrics.averagerating = averageratingAsFloat;
    
                }
    
              }
            resolve(jsonOutput);
            }
        );
      });
    }

    function getJetBrainsMarketPlaceData(campaign, getDataType, uri) {
      return new Promise(resolve => {
        //url = "https://plugins.jetbrains.com/plugin/13839-codewind/_assets/common.css?ver=11185"
        console.log("START: getJetBrainsMarketPlaceData")
        console.log("--- DEBUG - uri = "+uri)
        var uriPart = uri.split("/plugin/");
        var artifact = uriPart[1]; 
        console.log("--- DEBUG - artifact = "+artifact)
        
        request({

          uri: uri,

        }, function(error,response,body){
            //console.log(body);
            var bodyArray = body.split(/\r?\n/);
            var foundMetrics="no";
            var gotData;
            var dataCreatedTimestamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss');
            var jsonOutput = { campaign: campaign, getDataType: getDataType, artifact: artifact};

            jsonOutput.dataCreatedTimestamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss');
            jsonOutput.metrics={};
            dataInstance=0;
            for (i = 0; i < bodyArray.length; i++) { // find start of metrics data table in the html
              if ( bodyArray[i].includes("<script src=\"/_assets") && bodyArray[i].includes("dashboard")) { // find additional details of jetbrians _assets uri value
                console.log("-- DEBUG bodyArray[i] = "+bodyArray[i])
                var splitBody = bodyArray[i].split("\"");
                var fullUri = uri+splitBody[1]; // ignore <script src= .. and .. also ignore </sript>
                fullUri="https://plugins.jetbrains.com/_assets/dashboard.js?ver=12247"
                //fullUri="https://plugins.jetbrains.com/plugin/13839-codewind/_assets/common.js?ver=12247"
                //fullUri = "https://plugins.jetbrains.com/plugin/13839-codewind/_assets/dashboard.js?ver=12247"
                console.log("-- DEBUG fullUri = "+fullUri)

                puppeteer
                  .launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
                  .then(function(browser) {
                    return browser.newPage();
                  })
                  .then(function(page) {
                    return page.goto(fullUri).then(function() {
                      return page.content();
                    });
                  })
                  .then(function(html) {
                    console.log(html);
                    var splitHtml = html.split("Downloads");
                    //console.log(splitHtml[0])
                    var finalChars=splitHtml[0].substring(splitHtml[0].length-9); console.log("--finalChars = "+finalChars)
                    var finalCharsPart = finalChars.split("<span>")
                    var startOfDownloadsString = finalCharsPart[1]; console.log("-- startOfDownloadsString = "+startOfDownloadsString)
                    var startOfDownloadsStringPart = startOfDownloadsString.split(" ");
                    var jetBrainsInstallMetric = parseInt(startOfDownloadsStringPart[0]); console.log(jetBrainsInstallMetric)
                    jsonOutput.metrics.installs = jetBrainsInstallMetric
                    jsonOutput.metrics.rating = "This plugin hasn’t received enough ratings or reviews to display a summary."
                    resolve(jsonOutput);
                  });
                }
              }
            }
        );
      });
    }

    function getGithubRepoApiData(campaign, getDataType, uri) {
      return new Promise(resolve => {
        var uriPart = uri.split("/repos/");
        var artifact = uriPart[1];
        var jsonOutput = { campaign: campaign, getDataType: getDataType, artifact: artifact };
        if ( uri.substring(uri.length-8) === "releases" ) {
          jsonOutput.githubDataType="releases"
        }

        var customHeaderRequest = request.defaults({
          headers: {
            //'User-Agent': "NikCanvin",
            //requestHeader1Key: requestHeader1Value
            "User-Agent": githubUserAgent
          }
        })

        customHeaderRequest.get({
        //request({

          uri: uri,

        }, function(error,response,body){

            //var jsonOutput = { campaign: campaign, getDataType: getDataType };
            console.log(body)
            jsonOutput.dataCreatedTimestamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss');
            jsonOutput.githubData=JSON.parse(body)
            //resolve(body);
            resolve(jsonOutput);
          }
        );
      });
    }

    function getYouTubeChannelData(campaign, getDataType, uri) {
      return new Promise(resolve => {
        request({

          //uri: "https://marketplace.eclipse.org/content/codewind#group-metrics-tab",
          uri: uri,

        }, function(error,response,body){
            //console.log(body)
            var bodyArray = body.split(/\r?\n/);
            var videoUris=[];
            for (i = 0; i < bodyArray.length; i++) { // find start of metrics data table in the html
              if ( bodyArray[i].includes("<h3 class=\"yt-lockup-title \">")) {
                //console.log(bodyArray[i])
                var bodyArrayParts = bodyArray[i].split("watch?v=");
                var videoUriCode=bodyArrayParts[1].split("\""); //console.log(videoUriCode[0])
                videoUris.push(videoUriCode[0])
              }
            }
            resolve(videoUris);
            }
        );
      });
    }

    function getYouTubeVideoData(campaign, getDataType, uri) {
      return new Promise(resolve => {
        var dataCreatedTimestamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss');
        var jsonOutput = { campaign: campaign, getDataType: getDataType};
        jsonOutput.dataCreatedTimestamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss');
        request({
          uri: uri,
        }, function(error,response,body){
            var bodyArray = body.split(/\r?\n/);
            var uriParts=uri.split("/watch?v="); //console.log("uriParts = "+uriParts)
            var videoCode=uriParts[1]; console.log("DEBUG: videoCode = "+videoCode)
            var videoDataFound="no"
            for (i = 0; i < bodyArray.length; i++) { // find start of metrics data table in the html
              if ( bodyArray[i].includes("{\\\"title\\\":{\\\"runs\\\":[{\\\"text\\\":\\\"") && bodyArray[i].includes(videoCode) && videoDataFound=="no") {
                console.log("DEBUG - uri = "+uri)
                console.log("DEBUG - videoCode = "+videoCode)
                // title
                var titleStart = bodyArray[i].split("{\\\"title\\\":{\\\"runs\\\":[{\\\"text\\\":\\\"");
                var titleEndPart = titleStart[1].split("\\\"");
                var title = titleEndPart[0];
                //console.log("DEBUG - title = "+title)
                // date published
                var datePublishedStart = bodyArray[i].split("Published on ")
                var datePublishedEndPart = datePublishedStart[1].split("\\")
                var datePublished = datePublishedEndPart[0]
                //console.log("DEBUG - date published = "+datePublished)
                // views
                var viewsEnd = bodyArray[i].split(" views")
                var viewsStartPart = viewsEnd[0].split("\\\"")
                var views = viewsStartPart[viewsStartPart.length-1]
                views=views.replace(',','')
                var views = parseInt(views)
                //console.log("DEBUG - views = "+views)
                // likes
                var likeCountStart = bodyArray[i].split("likeCount\\\":");
                var likeCountEndPart = likeCountStart[1].split(",");
                var likes = likeCountEndPart[0];
                likes=likes.replace(',','')
                var likes = parseInt(likes)
                //console.log("DEBUG - likes = "+likes)
                // dislikes
                var dislikeCountStart = bodyArray[i].split("dislikeCount\\\":");
                var dislikeCountEndPart = dislikeCountStart[1].split(",");
                var dislikes = dislikeCountEndPart[0];
                dislikes=dislikes.replace(',','')
                var dislikes = parseInt(dislikes)
                //console.log("DEBUG - dislikes = "+dislikes)
                //console.log(".....")
                var youTubeVideoData = {
                  dataType:"youTube video",
                  dataCreatedTimeStamp:dataCreatedTimestamp,
                  uri:uri,
                  videoCode:videoCode,
                  title:title,
                  datePublished:datePublished,
                  views:views,
                  likes:likes,
                  dislikes:dislikes
                }
                //console.log(youTubeVideoData)
              }
            }
            resolve(youTubeVideoData);
            }
        );
      });
    }

    function getTwitterUserTweetsData(campaign, getDataType) {
      console.log("STARTING - get twitter data")
      return new Promise(resolve => {
        // get credentials from KubeSecrets, else endpoint parms, else fail
        if ( process.env.TwitterAPIkeyNikCanvin ) { // test and use environment var if it exists (production case)
          var TwitterAPIkey=process.env.TwitterAPIkeyNikCanvin; console.log("--- TwitterAPIkey secret = "+TwitterAPIkey);
          var TwitterAPISecretKey=process.env.TwitterAPISecretKeyNikCanvin; console.log("--- TwitterAPISecretKey secret = "+TwitterAPISecretKey);
          var TwitterAccessToken=process.env.TwitterAccessTokenNikCanvin; console.log("--- TwitterAccessToken secret = "+TwitterAccessToken);
          var TwitterAccessTokenSecret=process.env.TwitterAccessTokenSecretNikCanvin; console.log("--- TwitterAccessTokenSecret secret = "+TwitterAccessTokenSecret);
        } else if ( req.query.TwitterAPIkey ) { // test and use request parameter var if it exists (local dev case)
          var TwitterAPIkey = req.query.TwitterAPIkey; console.log("--- TwitterAPIkey secret = "+TwitterAPIkey);
          var TwitterAPISecretKey = req.query.TwitterAPISecretKey; console.log("--- TwitterAPISecretKey secret = "+TwitterAPISecretKey);
          var TwitterAccessToken = req.query.TwitterAccessToken; console.log("--- TwitterAccessToken secret = "+TwitterAccessToken);
          var TwitterAccessTokenSecret = req.query.TwitterAccessTokenSecret; console.log("--- TwitterAccessTokenSecret secret = "+TwitterAccessTokenSecret);
        } else { // error case
          console.log("ERROR - access crendentials were not set");
          res.send("ERROR - access crendentials were not set");
        }
        ////////////
        if (req.query.TwitterScreenName) {
          var TwitterScreenName = req.query.TwitterScreenName; // User name of twitter account you want data for
        } else {
          console.log("ERROR -'TwitterScreenName' (twitter user name) parameter missing");
          res.send("ERROR -'TwitterScreenName' (twitter user name) parameter missing");
        } 

        var client = new Twitter({
          consumer_key: TwitterAPIkey,
          consumer_secret: TwitterAPISecretKey,
          access_token_key: TwitterAccessToken,
          access_token_secret: TwitterAccessTokenSecret
        });


        var params = {
          screen_name: TwitterScreenName,
          count:200
        };
        // get tweets from the user timeline
        client.get('statuses/user_timeline', params, function(error, tweets, response) {
          if (error) {
            //res.send(error);
            console.log(error);
          } else {
            // get the followers/list (includes other good stuff too)
            client.get('users/show', params, function(error, users, response) {
              if (error) {
                //res.send(error);
                console.log(error);
              } else {
                var dataCreatedTimeStamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss');
                var jsonOutput={
                  campaign:campaign,
                  getDataType:getDataType,
                  dataCreatedTimeStamp:dataCreatedTimeStamp,
                  twitterUsers:users,
                  twitterUserTimeline:tweets
                };
                resolve(jsonOutput);
              }
            });
          }
        });
      });
    }




    function handleFinalJsonOutput(jsonOutput, runMode) {
      console.log("START: handleFinalJsonOutput")
      var simpleTimeStamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss'); simpleTimeStamp = simpleTimeStamp.replace(/:/g, ""); simpleTimeStamp = simpleTimeStamp.replace(/\//g, "");
      var id = campaign+"--"+getDataType+"--"+simpleTimeStamp
      jsonOutput._id = id;
      console.log(jsonOutput)
      if ( runMode === "production" ) {
        console.log("-- runMode = production (store results in production couchdb) ")
        request({
          uri: "http://datastore-default.apps.riffled.os.fyre.ibm.com/advocacy/"+id,
          method: "PUT",
          headers: {
              'Content-type': 'application/json'
          },
          body: jsonOutput,
          json: true
        }, (error, response, body) => {
          console.log(error)
        })
      } else {
        console.log("-- runMode = dev .... (DO NOT store results in production couchdb) ")
      }      
      res.json(jsonOutput)
      //console.log(jsonOutput)
      console.log("ENDED: handleFinalJsonOutput")
    }



    async function run(){
      console.log("DEBUG: getDataType = "+getDataType)
      if (getDataType === "EclipsePluginMarketplaceMetrics" ) {
        getEclipseMarketPlaceData(campaign, getDataType, uri)
        .then((jsonOutput) => {
          handleFinalJsonOutput(jsonOutput, runMode);
        })
      } else if (getDataType === "VSCodePluginMarketplaceMetrics" ) {
        console.log("VSCODE case")
        getVSCodeMarketPlaceData(campaign, getDataType, uri)
        .then((jsonOutput) => {
          handleFinalJsonOutput(jsonOutput, runMode);
        })
      } else if (getDataType === "JetBrainsPluginMarketplaceMetrics" ) {
        console.log("JetBrains case")
        getJetBrainsMarketPlaceData(campaign, getDataType, uri)
        .then((jsonOutput) => {
          handleFinalJsonOutput(jsonOutput, runMode);
        })
      } else if (getDataType === "GithubRepoApi" ) {
        console.log("GITHUB REPO API case")
        getGithubRepoApiData(campaign, getDataType, uri)
        .then((jsonOutput) => {
          handleFinalJsonOutput(jsonOutput, runMode);
        })
      } else if (getDataType === "YouTubeChannel" ) {
        console.log("STARTED YouTube Channel case")
        var videoUris = await getYouTubeChannelData(campaign, getDataType, uri); console.log(videoUris)
        var dataCreatedTimeStamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss');
        var jsonOutput={
          campaign:campaign,
          getDataType:"YouTubeChannel",
          dataCreatedTimeStamp:dataCreatedTimeStamp,
          metrics:[]
        };
        for(let videoUriCode of videoUris){
          videoUriCode="https://www.youtube.com/watch?v="+videoUriCode; //console.log(videoUriCode)
          var outputData = await getYouTubeVideoData(campaign, getDataType, videoUriCode)
          jsonOutput.metrics.push(outputData)
        }
        handleFinalJsonOutput(jsonOutput, runMode);
        //console.log(jsonOutput)
        //res.json(jsonOutput)
        // var videoUriCode="https://www.youtube.com/watch?v=8uXhyUi-JC4"; //console.log(videoUriCode)
        // await getYouTubeVideoData(campaign, getDataType, videoUriCode)
        console.log("ENDED YouTube Channel case")
      } else if (getDataType === "YouTubeVideo" ) {
          console.log("STARTED YouTube Video case")
          var dataCreatedTimeStamp = timestamp.utc('YYYY/MM/DD:HH:mm:ss');
          var outputData = await getYouTubeVideoData(campaign, getDataType, uri)
          var jsonOutput={
            campaign:campaign,
            getDataType:getDataType,
            dataCreatedTimeStamp:dataCreatedTimeStamp,
            uri:uri,
            videoCode:outputData.videoCode,
            title:outputData.title,
            datePublished:outputData.datePublished,
            views:outputData.views,
            likes:outputData.likes,
            dislikes:outputData.dislikes
          };
          //jsonOutput.metrics.push(outputData)
          handleFinalJsonOutput(jsonOutput, runMode);
          console.log("ENDED YouTube Video case")
      } else if (getDataType === "TwitterUserData" ) {
          console.log("STARTED TwitterUserTweets case")
          var jsonOutput = await getTwitterUserTweetsData(campaign, getDataType)
          //jsonOutput.metrics.push(outputData)
          handleFinalJsonOutput(jsonOutput, runMode);
          console.log("ENDED TwitterUserTweets case")
      } else {
          console.log("WHOOPS - getDataType NOT RECOGNISED")
          res.send("WHOOPS - getDataType NOT RECOGNISED")
      }
    }

    run();

  });


  app.use('/get-data', router);
}
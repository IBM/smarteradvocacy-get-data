# Smarter Advocacy

This cloud-native express/node.js microservice, is part of a set which comprise a 'Smarter Advocacy' capability. More details about this will follow soon.

# The microservice in this repo

The simple goal for this microservice is to offer a stateless generic capability, that can get data from various supported channels and return well organised consistent business data needed in a JSON document.

**Example OUTPUT:**   
In this twitter case, 'twitterUsers' includes followers_count and 'twitterUserTimeline includes an array of tweets (zero is the latest one) each of which has retweet and like counts (in the default Twitter API, 'like' is tagged 'favorite'):

![examle twitter JSON output](images/example-twitter-json-output.png?raw=true "examle twitter JSON output")

**For you to build and deploy:**  
- For development use, using Codewind is recommended - instructions to follow!
- For production use, here are tips how to build, deploy and run this cloud-native express/node.js microservice, are in a 
[separate BLOG here](https://medium.com/nikcanvin/how-to-build-a-docker-microservice-application-and-deploy-to-openshift-fdb0769f1b9f).

**Only within IBM, this microservice is already deployed:**  
- [deployed on a OpenShift cluster here](http://smart-adv-get-data-default.apps.riffled.os.fyre.ibm.com/)

**Overview of workflow:**  
![overview picture](images/overview.png?raw=true "Diagramatic overview of this picture")

**Supported channels to get data from:**
1. the GitHub API; for everything from project waters/stars/forks to releases.
2. the IBM GitHub API; for everything from project waters/stars/forks to releases.
3. the Twitter API; for user profile data like followers, friends and data about every tweet they'd made, with retweet/likes. Note: detailed engagement data (such as impressions and link clicks) are not supported, as Twitter does not make this data freely available in the API being used by this microservice. 
4. YouTube video channels and individual videos, where metrics such as views, likes and dislikes were captured.
5. Eclipse plugin marketplace; collects plugin number of installs, ranking and clickthrough metrics.
6. VSCode plugin marketplace; collects plugin number of installs and average rating metrics.

**Notes:**
1. support for many more channels was planned, but yet to be implemented (such as get data from Google Analytics API).
2. currently, the microservice is hardcoded to push the resultant JSON document to a hardcorded COUCHDB instance (but we should probably split the microservice into two parts, the first to produce the JSON document with an option where to the send it and the second to handle store in a COUCHDB. Other places to send/store the data could also be supported in future).

...

![Codewind logo](images/codewind.png?raw=true "Codewind logo")

***This microservice was created and iteratively developed using [Codewind](https://www.eclipse.org/codewind/).***  
*Codewind is an open source plugin for Eclispe and VS Code IDEs, that simplifies and enhances development in containers by extending industry standard IDEs with features to write, debug, and deploy cloud-native applications.* 

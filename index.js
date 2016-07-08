'use strict';

if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    console.log('Error: Specify page_token in environment');
    process.exit(1);
}

if (!process.env.FACEBOOK_VERIFY_TOKEN) {
    console.log('Error: Specify verify_token in environment');
    process.exit(1);
}

var Botkit = require('botkit');
var request = require('request');

var controller = Botkit.facebookbot({
    debug: true,
    access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
});

var bot = controller.spawn({
});

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(controller.webserver, bot, function() {
        console.log('ONLINE!');
    });
});

var SetThreadSettings = function() {
    var PostThreadSettings = function(parameters) {
        request.post("https://graph.facebook.com/v2.6/me/thread_settings?access_token=" +  process.env.FACEBOOK_PAGE_ACCESS_TOKEN, 
        function(err, res, body) {
            if (err) {
                console.log(error);
            } else {
                console.log(res.statusCode, body);
            }
        }).form(parameters);
    }
    
    // Greeting Text
    PostThreadSettings({
        "setting_type":"greeting",
        "greeting":{
            "text":"Chariot is here to help!"
        }
    });
    
    // Get Started Button
    PostThreadSettings({
        "setting_type":"call_to_actions",
        "thread_state":"new_thread",
        "call_to_actions":[
            {
            "payload":"GET_STARTED"
            }
        ]
    });
    
    // Persistent Menu
    PostThreadSettings({
        "setting_type":"call_to_actions",
        "thread_state":"new_thread",
        "call_to_actions":[
            {
            "type":"postback",
            "title":"Help",
            "payload":"HELP"
            },
            {
            "type":"web_url",
            "title":"View Website",
            "url":"http://getchariot.com/"
            }
        ]
    });
}

// var sendAPI = function(userId, contents) {
//     request.post("https://graph.facebook.com/v2.6/me/messages?access_token=" +  process.env.FACEBOOK_PAGE_ACCESS_TOKEN, 
//         function(err, res, body) {
//             if (err) {
//                 console.log(error);
//             } else {
//                 console.log(res.statusCode, body);
//             }
//         }).form({
//             "recipient":{
//                 "id":userId
//             },
            //    etc
//         });
// }

var respondToUserInfo = function(user, foo) {
    console.log("Access token: " + process.env.FACEBOOK_PAGE_ACCESS_TOKEN);
    request.get('https://graph.facebook.com/v2.6/' + user + '?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=' + process.env.FACEBOOK_PAGE_ACCESS_TOKEN, 
    function(err, res, body) {
            if (err) {
                console.log(err);
            } else {
                foo(JSON.parse(body));
            }
        });
}

SetThreadSettings();

controller.hears(["GET_STARTED"], 'facebook_postback', function(bot, message) {
    bot.startConversation(message, function(err, convo) {
        convo.say({
            "text":"Are you ready?",
            "quick_replies":[
            {
                "content_type":"text",
                "title":"Yeah!",
                "payload":"START_QUESTIONS"
            },
            {
                "content_type":"text",
                "title":"View Terms of Use",
                "payload":"TERMS_OF_USE"
            }
            ]
        })
    });
});

controller.hears(["start"], 'message_received', function(bot, message) {
    bot.startConversation(message, function(err, convo) {
        convo.ask({
            "text": "Hey! Before we can match you up with a carpool, we need to ask you a few questions. Are you ready?",
            "quick_replies": [
                {
                    "content_type":"text",
                    "title":"Yeah!",
                    "payload":"START_QUESTIONS"
                }
            ]
        }, function(response, convo) {
            askCommuteOrigin(response, convo);
            // whoa, I got the postback payload as a response to my convo.ask!
            convo.next();
        });
    });

// original handler for START_QUESTIONS postback
// controller.hears(["START_QUESTIONS"], 'facebook_postback', function(bot, message) {
//  but now it is this...
    
    var askCommuteOrigin = function(response, convo) {
        bot.startConversation(message, function(err, convo) {
            convo.ask("👍 Where do you commute from? (suburb, city)", function(response, convo) {
                askCommuteDestination(response, convo);
                convo.next();
            });
        });
    }
    
    var askCommuteDestination = function(response, convo) {
        convo.ask("👍 Where do you commute to? (suburb, city)", function(response, convo) {
            askOutboundTime(response, convo);
            convo.next();
        });
    }
    
    var askOutboundTime = function(response, convo) {
        convo.ask({
            "text": "👍 Select the time you usually leave in the morning.",
            "quick_replies": [
                {
                    "content_type":"text",
                    "title":"5:00-5:30am",
                    "payload":"5:00-5:30am"
                },
                {
                    "content_type":"text",
                    "title":"5:30-6:00am",
                    "payload":"5:30-6:00am"
                },
                {
                    "content_type":"text",
                    "title":"6:00-6:30am",
                    "payload":"6:00-6:30am"
                },
                {
                    "content_type":"text",
                    "title":"6:30-7:00am",
                    "payload":"6:30-7:00am"
                },
                {
                    "content_type":"text",
                    "title":"7:00-7:30am",
                    "payload":"7:00-7:30am"
                },
                {
                    "content_type":"text",
                    "title":"7:30-8:00am",
                    "payload":"7:30-8:00am"
                },
                {
                    "content_type":"text",
                    "title":"8:00-8:30am",
                    "payload":"8:00-8:30am"
                },
                {
                    "content_type":"text",
                    "title":"8:30-9:00am",
                    "payload":"8:30-9:00am"
                },
                {
                    "content_type":"text",
                    "title":"9:00-9:30am",
                    "payload":"9:00-9:30am"
                },
                {
                    "content_type":"text",
                    "title":"Other",
                    "payload":"9:30-10:00am"
                }
            ]
        }, function(response, convo) {
            convo.say("Oh, cool");
            askReturnTime(response, convo);
            convo.next();
        });
    }
    
    var askReturnTime = function(response, convo) {
        convo.ask({
            "text": "👍 Select the time you usually return from work.",
            "quick_replies": [
                {
                    "content_type":"text",
                    "title":"3:00-3:30pm",
                    "payload":"5:00-5:30am"
                },
                {
                    "content_type":"text",
                    "title":"3:30-4:00pm",
                    "payload":":30-6:00am"
                },
                {
                    "content_type":"text",
                    "title":"4:00-4:30pm",
                    "payload":"5:00-5:30am"
                },
                {
                    "content_type":"text",
                    "title":"4:30-5:00pm",
                    "payload":":30-6:00am"
                },
                {
                    "content_type":"text",
                    "title":"5:00-5:30pm",
                    "payload":"5:00-5:30am"
                },
                {
                    "content_type":"text",
                    "title":"5:30-6:00pm",
                    "payload":":30-6:00am"
                },
                {
                    "content_type":"text",
                    "title":"6:00-6:30pm",
                    "payload":"5:00-5:30am"
                },
                {
                    "content_type":"text",
                    "title":"6:30-7:00pm",
                    "payload":":30-6:00am"
                },
                {
                    "content_type":"text",
                    "title":"7:00-7:30pm",
                    "payload":"5:00-5:30am"
                },
                {
                    "content_type":"text",
                    "title":"Other",
                    "payload":":30-6:00am"
                }
            ]
        }, function(response, convo) {
            askTransport(response, convo);
            convo.next();
        });
    }
    
    var askTransport = function(response, convo) {
        convo.ask({
            "text": "👍 Last question: how do you usually get to work?",
            "quick_replies": [
                {
                    "content_type":"text",
                    "title":"Car",
                    "payload":"5:00-5:30am"
                },
                {
                    "content_type":"text",
                    "title":"Bus, Train, Ferry",
                    "payload":"5:30-6:00am"
                },
                {
                    "content_type":"Other",
                    "title":"Other",
                    "payload":"5:30-6:00am"
                }
            ]
        }, function(response, convo) {
            done(response, convo);
            convo.next();
        });
    }
    
    
    var done = function(response, convo) {
        convo.say("Wooo! You're all done. We'll message you as soon as we think we've found a suitable carpool for you.")
        convo.ask({
            "text": "In the meantime, we want to let everyone around New Zealand know we're doing this. How about showing your support by helping us spread the word?",
            "quick_replies": [
                {
                    "content_type":"Sure, what can I do to help?",
                    "title":"Car",
                    "payload":"5:00-5:30am"
                }
            ]
        }, function(response, convo) {
            convo.say("Awesome! We'd love it if you could tell your friends about us. Here's a link you can share on your Facebook timeline. https://www.messenger.com/t/631350073695737")
            convo.say("Cheers!");
            convo.next();
        });
    }
});

var replyToPostback = function(postbackStr, reply) {
    controller.hears([postbackStr], 'facebook_postback', function(bot, message) {
        bot.startConversation(message, function(err, convo) {
            convo.say(reply);
        });
    });
}

// replyToPostback("START_QUESTIONS", "Where do you commute from? (suburb, city)");

// replyToPostback("WORK_ADDRESS", "Where do you commute to? (suburb, city)");

// replyToPostback("");

// ASK QUESTION


// TERMS_OF_USE postback




// configureWelcomeMessage();

// // this is triggered when a user clicks the send-to-messenger plugin
// controller.on('facebook_optin', function(bot, message) {
//     bot.reply(message, 'Welcome to my app!');
// });

// controller.on('facebook_postback', function(bot, message) {
//     // This does nothing at the moment
// });

// controller.hears(['what is my name', "who am i", "what'?s my name"], 'message_received', function(bot, message) {
//     respondToUserInfo(message.user, function(userInfo) {
//         bot.startConversation(message, function(err, convo) {
//             console.log(JSON.stringify(userInfo));
//             convo.say("Your name is " + userInfo.first_name + ".");

//         });
//     });
// });

// simpleResponses.handlers(controller);

// controller.hears(["what (.*) can you", "how (.*) can you", "which (.*) can you", "why (.*) can you"], 'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("Hmm...");
//         convo.say("I'm not sure sorry.")
//         convo.say("My creators can't told me that yet!");
//     });  
// });

// controller.hears(["^can you"], 'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("Sorry, I'm not sure I can.");
//         convo.say("My creators haven't taught me how yet.");
//     });  
// });

// controller.hears(["who created you", "who built you", "who are your creators", "who made you", "who are your masters", "who is your creator", "who is your maker", "who is your master"], 'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("Three great looking blokes from Auckland, New Zealand.");
//         convo.say("Callum Herries, Menilik Dyer, and Paulo Dunkan.");
//     });  
// });

// var simpleResponse = function(ears, mouth) {
//     controller.hears(ears, function(bot, message) {
//         bot.startConversation(message, function(err, convo) {
//             for (var a=0; a < mouth.length; a++) {
//                 convo.say(mouth[a]);
//             }
//         });
//     });
// }

// controller.hears(["tell me a joke", "tell me something funny"], function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("Chuck Norris can cut through a hot knife with butter.");
//     });
// });

// controller.hears(["do you know yours?"], function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("Of course.");
//     });
// });

// controller.hears(["donald trump"], function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("Donald trump huh.");
//         convo.say("Do you know how many people are asking that question?!");
//         answer(bot, message);
//     });
// });

// controller.hears(["will you", "will u", "you (.*) or (.*)"],  'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("I can't say either way.");
//     });
// });

// controller.hears(['what is my last name', "what'?s my name"], 'message_received', function(bot, message) {
//     respondToUserInfo(message.user, function(userInfo) {
//         bot.startConversation(message, function(err, convo) {
//             console.log(JSON.stringify(userInfo));
//             convo.say("Oh man, that's easy!");
//             convo.say("Your name is " + userInfo.last_name + ".");
//         });
//     });
// });

// controller.hears(["do you think", "your opinion"],  'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("Opinions are for the weak.");
//         convo.say("However...");
//         answer(bot, message);   
//     });  
// });

// controller.hears(["who is chuck norris"], 'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("He's a guy you shouldn't bother with stupid questions.")
//         convo.say({
//             "attachment": {
//                 "type":"image",
//                 "payload":{
//                     "url": "https://pbs.twimg.com/profile_images/2098661241/chuck_norris_pic.jpg"
//                 }
//             }
//         });                   
//     });
// });

// controller.hears(["is your favourite", "is ur favourite"], 'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("I don't have favourites.");
//         convo.say("Ask a real question.");
//     });
// });

// controller.hears(["send me (.*)", "show me (.*)", "give me (.*)", "tell me (.*)"], 'message_received', function(bot, message) {
//     message.text = message.match[1];
    
//     bot.startConversation(message, function(err, convo) {
//         convo.say("Alright.");
//         convo.say("Hold on a sec.");
//     });
    
//     console.log("GOT QUERY" + message.text);
//     answer(bot, message);
// });

// controller.hears(["how old are you"], 'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("76 years old.");
//     });
// });

// controller.hears(["when were you born"], 'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("March 10, 1940.");
//     });
// });

// controller.hears(["are you"], 'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("I'm not sure, I've yet to work that out.");
//     });
// });

// controller.hears(["what do you"], 'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("I don't bother with such things.");
//     });
// });

// controller.hears(["do you"], 'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("I don't.");
//     });
// });

// controller.hears(["do i ", "will i ", "should i "],  'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say("Well, that's really up to you.");
//         convo.say("However...");
//     });  
    
//     answer(bot, message);
// });

// controller.hears(["s the time in", "time is it in", "what time is it in"],  'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         answer(bot, message);
//     });   
// });

// controller.hears(["what'?s the time", "what is the time", "what time is it"],  'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.ask("What is the time where?", function(response, convo) {
//             message.text = "what is the time in " + response.text
//             answer(bot, message);
//             convo.next();
//         });
//     });   
// });

// controller.hears(["which", "what", "whose", "who", "why", "how", "is", "when", "where", "are", "do", "can", "shall", "will", "would", "should", "could"], 'message_received', function(bot, message) {
//     if (!isQuestion(message.text)) {
//         isntQuestionConvo(bot, message);
//     } else {
//         answer(bot, message);
//     }
// });

// controller.hears(["lol", "lmao", "haha", "rofl"], 'message_received', function(bot, message) {
//     bot.startConversation(message, function(err, convo) {
//         convo.say(":D");
//     });  
// });

// controller.hears(['(.*)'], 'message_received', function(bot, message) {
//     if (!isQuestion(message.text)) {
//         isntQuestionConvo(bot, message);
//     } else {
//         answer(bot, message);
//     }
// });

// // controller.on('message_received', function(bot,message) {
// //     // do stuff if it doesn't find a match straight away
// //     var searchUrl;
    
// //     console.log(JSON.stringify(message));
    
// //     bot.say('You said ' + message.text);
// //     console.log(message.text);
    
// //     bot.startConversation(message, function(err, convo) {
// //         convo.ask('Hey! What would you like to ask?', function(response, convo) {
// //            searchUrl = search(response.text);
// //            convo.say("Is this what you're looking for?")
// //            convo.say(searchUrl);
// //            convo.stop();
// //         });
        
// //     });
// // });

// // ---------------------------------- end of controller calls ----------------------------------------------
// //
// // ---------------------------------- start of functions ---------------------------------------------------

// var answer = function(bot, message) {

//     var googleSearchConvo,
//         wolframAlphaConvo;
    
//     googleSearchConvo = function(query) {
//         console.log("Performing GOOGLE SEARCH " + query);
        
        
//         customsearch.cse.list({ cx: CX, q: query, auth: CUSTOM_SEARCH_API_KEY }, function (err, response) {
//             if (err) {
//                 return console.log('An error occured', err);
//             } 
                                    
//             // Got the response from custom search
//             if (response.items && response.items.length > 0) {
//                 console.log(JSON.stringify(response.items[0], null, 2));
                
//                 bot.startConversation(message, function(err, convo3) {
//                     if (response.items[0].pagemap) {
//                         if (response.items[0].pagemap.cse_image) {
//                             convo3.say({
//                                 "attachment":{
//                                     "type":"image",
//                                     "payload":{
//                                         "url": response.items[0].pagemap.cse_image[0].src
//                                     }
//                                 }
//                             });
//                         }    
//                     }
//                     convo3.say(response.items[0].title);
//                     convo3.say(response.items[0].link);
//                 });
//             } else {
//                 console.log("GOOGLE SEARCH ERROR! REPONSE=" + JSON.stringify(response, null, 2));
//             }
//         });
//     }
    
//     wolframAlphaConvo = function(query) {
        
//         var wolfram = wolframs[Math.floor(Math.random() * wolframs.length)];
        
//         wolfram.query(query, function(err, result) {
//             if(err) {
//                 return console.log('An error occured', err);
//             }
//             if (!result) {
//                 console.log("Could not find a result from Wolfram Alpha.");
//                 bot.reply(message, "Check this out");
//                 googleSearchConvo(query);
//             } else if (result.queryresult.$.success == "false" || !result.queryresult.pod) {
//                 bot.reply(message, "Check this out");
//                 googleSearchConvo(query);
//                 console.log(JSON.stringify(result, null, 2));
//             } else {
//                 // TODO:
//                 // bot.startConversation(message, function(err, convo2) {
//                 var displayed = false;
//                 var solved = false;
                
//                 bot.startConversation(message, function(err, convo2) {
                
//                         //console.log(JSON.stringify(result, null, 2));
//                     for(var a=0; a<result.queryresult.pod.length; a++) 
//                     {
//                         var pod = result.queryresult.pod[a];
                        
//                         console.log("Printing pod title: \n" + JSON.stringify(pod.$.title, null, 2));
//                         console.log("Printing message: \n" + JSON.stringify(query, null, 2));
                        
//                         // if primary == true
//                         if (pod.$.primary == "true" && pod.subpod[0].plaintext[0] != "(data not available)" && (pod.$.title == "Result" || pod.$.title == "Current Result")) {
//                             if (pod.subpod[0].plaintext[0].length) {
                                
//                                 console.log("FOUND RESULT");
//                                 var primaryResult = pod.subpod[0].plaintext[0].split("/[|\n]+/");
                                
//                                 for (var b=0; b < primaryResult.length; b++) {
//                                     convo2.say(primaryResult[b]);
//                                 }
                                
//                             } else {
//                                 convo2.say({
//                                     "attachment":{
//                                         "type":"image",
//                                         "payload":{
//                                             "url": pod.subpod[0].img[0].$.src
//                                         }
//                                     }
//                                 });
//                             }
//                             console.log(JSON.stringify(pod.subpod[0], null, 2));
//                             displayed = true;
//                             solved = true;
//                         }
                        
//                         // image
//                         if (pod.$.title == "Image") {
//                             console.log(JSON.stringify(pod.subpod[0], null, 2));
//                             convo2.say({
//                                 "attachment":{
//                                     "type":"image",
//                                     "payload":{
//                                         "url": pod.subpod[0].img[0].$.src
//                                     }
//                                 }
//                             });
//                             displayed = true;
//                         }
                        
//                         if (pod.$.title == "Definitions" && !solved) {
//                             convo2.say("This is the most common definition:");
//                             console.log(JSON.stringify(pod.subpod[0].plaintext[0], null, 2));
//                             var definitions = pod.subpod[0].plaintext[0].split("\n");
//                             convo2.say(definitions[0].split("|")[2]);
//                             displayed = true;
//                         }
                        
//                         // Notable facts
//                         if (pod.$.title == "Notable facts") {
                            
//                             var basicfacts = pod.subpod[0].plaintext[0].split("\n");
//                             console.log(JSON.stringify(pod, null, 2));
                            
//                             convo2.ask("I know a lot about this. Want to hear some facts?", [
//                                 {
//                                     pattern: (/^(yes|yea|yup|yep|ya|sure|ok|y|yeah|yah|sure|yeh|ye|go|fire)/i),
//                                     callback: function(response, convo2) {
                            
//                                         for (var b=0; b < basicfacts.length; b++) {
//                                             convo2.say(basicfacts[b]);
//                                         }
                                        
//                                         convo2.next();
//                                     }
//                                 },
//                                 {
//                                     pattern: bot.utterances.no,
//                                     callback: function(response, convo2) {
//                                         // say something here
//                                         convo2.say("Oh, alright.");
//                                         convo2.next();
//                                     }
//                                 },
//                                 {
//                                     default: true,
//                                     callback: function(response, convo2) {
//                                         convo2.repeat();
//                                         convo2.next();
//                                     }
//                                 }
//                             ]);
//                             console.log(JSON.stringify(pod.subpod[0].plaintext[0], null, 2));
                            
                            
//                             displayed = true;
//                         }
//                     }
                    
//                         // say something here?
//                     if (displayed == false) {
//                         // this is where I start a google search
//                         convo2.say("Check this out:");
//                         googleSearchConvo(query);
//                     }
//                 });
//             }
//         }); 
//     };
    
//     bot.reply(message, "Hmmm...");
//     wolframAlphaConvo(message.text);
// }

// var isntQuestionConvo = function(bot, message) {
//     if (message.text.split(" ").length > 1) {
//         bot.startConversation(message, function(err, convo) {
//             convo.say("You trying to muck me round?");
//             convo.say("That doesn't look like a question.");
//         });
//     } else {
//         bot.reply(message, ":)");
//     }
// }

// var isQuestion = function(text) {
//     var textArray,
//         firstWord,
//         secondWord,
//         qArray;
        
//     qArray = ["which", "at", "in", "of", "if", "what", "what's", "whats", "whose", "who's", "whos", "who", "why", "how", "hows", "how's", "is", "when", "whens", "when's", "where", "wheres", "where's", "are", "do", "can", "shall", "will", "would", "should", "could"];
//     textArray = text.split(" ");
//     firstWord = textArray[0].toLowerCase();
//     if (textArray[1]) {
//         secondWord = textArray[1].toLowerCase();
//         return (qArray.indexOf(firstWord) > -1 || qArray.indexOf(secondWord) > -1);
//     } else {
//         return (qArray.indexOf(firstWord) > -1 || qArray.indexOf(secondWord) > -1);
//     }
// }

// var buttonReply = function(bot, message) {
//     bot.reply(message, {
//         "attachment":{
//             "type":"template",
//             "payload":{
//                 "template_type":"button",
//                 "text": 'To submit your own story, say: "I want to submit a funny story."\nTo hear other people\'s funny stories... press the button below.',
//                 "buttons":[
//                     {
//                         "type":"postback",
//                         "title": "Tell me stories",
//                         "payload":"MORE_STORIES",
//                     }
//                 ]
//             }
//         }
//     });
// }

// var justSayConvo = function(convo) {
//     convo.say('say something common to a lot of conversations here')
// }

// var yesNoConvo = function(response, convo) {
  
//   convo.ask('Would you like to say yes, or no?', [
//         {
//             pattern: bot.utterances.yes,
//             callback: function(response, convo) {
                
//                 // say something here
//                 convo.say('you said yes');
                
//                 // since no further messages are queued after this,
//                 // the conversation will end naturally with status == 'completed'
//                 convo.stop();
//             }
//         },
//         {
//             pattern: bot.utterances.no,
//             callback: function(response, convo) {
//                 // say something here
//                 convo.say('you said no');
                
//                 // stop the conversation. this will cause it to end with status == 'stopped'
//                 convo.say("Okay. That\'s enough for today.")
//                 convo.stop();
//             }
//         },
//         {
//             default: true,
//             callback: function(response, convo) {
//                 convo.repeat();
//                 convo.next();
//             }
//         }
//     ]);
// }
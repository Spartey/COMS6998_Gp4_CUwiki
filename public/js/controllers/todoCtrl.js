/*global todomvc, angular, Firebase */
'use strict';

/**
* The main controller for the app. The controller:
* - retrieves and persists the model via the $firebaseArray service
* - exposes the model to the template and provides event handlers
*/
todomvc.controller('TodoCtrl',
['$rootScope', '$scope', '$location', '$http', '$sce', '$localStorage', '$window',
function ($rootScope, $scope, $location, $http, $sce, $localStorage, $window) {
	// set local storage
	$scope.$storage = $localStorage;

	var scrollCountDelta = 10;
	$scope.maxQuestion = scrollCountDelta;
	var backendUrl = "http://ec2-52-70-38-116.compute-1.amazonaws.com:8080";
	// For sorting
	var sortType="createdAt";
	var sortReverse=false;

	var splits = $location.path().trim().split("/");
	var roomId = angular.lowercase(splits[1]);
	if (!roomId || roomId.length === 0) {
		roomId = "all";
	}
	$scope.roomId = roomId;
	// Should we limit?
	//.limitToFirst(1000);
	// initialize the room list
	$scope.roomList=[];
	$scope.todos = [];
	$scope.users=[];
	$rootScope.currentUser=null;
	$scope.isAdmin=false;
	$scope.input = {
		type: 'question',
		choices: [{name:""}],
		tags: [],
		title: "",
		desc: "",
	}



 // GET QuestionsList,RoomList, UserList
	var getQuestions = function (query) {
		//request from backend about the todo
		query = query || {}
		if (!query.roomId) query.roomId = roomId;
		var params = $.param(query);
		$http.get(`/api/questions?${params}`)
		.success(function(data) {
			$scope.todos = data;
			console.log(data);
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});
	}
	getQuestions();


	$scope.getQuestionsByTag=function(tag){
		getQuestions({tags: tag});
	}

	var getUsers = function (query) {
		//request from backend about the todo
		query = query || {}
		$http.get('/api/users')
		.success(function(data) {
			$scope.users = data;
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});
	}

	getUsers();

	var getRoomList = function () {
		$http.get('/api/rooms')
		.success(function(data) {
			$scope.roomList = data;
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});
	};
	getRoomList();

	$scope.getCurrentUser = function () {
		$http.get(backendUrl+'/api/users/current')
		.success(function(data) {
			$rootScope.currentUser=data;

		})
		.error(function(data) {
			console.log('Error: ' + data);

		});
	};
	$scope.getCurrentUser();

// The end of GET part

	$scope.editedTodo = null;

	// pre-precessing for collection
	$scope.$watchCollection('todos', function () {
		var total = 0;
		var remaining = 0;
		$scope.todos.forEach(function (todo) {
			// Skip invalid entries so they don't break the entire app.
			if (!todo || !todo.head ) {
				return;
			}

			total++;
			if (todo.completed === false) {
				remaining++;
			}
		});

		$scope.totalCount = total;
		$scope.remainingCount = remaining;
		$scope.completedCount = total - remaining;
		$scope.allChecked = remaining === 0;
		$scope.absurl = $location.absUrl();
	}, true);

	$scope.getAdmin=function(user){

		$http.post(backendUrl + '/api/users/'+user._id, {type:"admin"})
		.success(function(data) {
			$scope.isAdmin=true;
	    })
	    .error(function(data) {
	        console.log('Error: ' + data);
	        $scope.isAdmin=false;
	    });
	    return true;

	}
	$scope.quitAdmin=function(user){
		$http.post(backendUrl + '/api/users/'+user._id, {type:"normal"})
		.success(function(data) {
			$scope.isAdmin=false;
	    })
	    .error(function(data) {
	        console.log('Error: ' + data);
	        $scope.isAdmin=true;
	    });
	    return false;
	}

	$scope.selectTag = function(input) {
 		var Msg;
 		try{
 			if ($scope.input.wholeMsg.trim()){
 				Msg = $scope.input.wholeMsg.trim() + input;
 			}
 			else{
 				Msg = input;
 			}
 		}
 		catch(e){Msg=input;}
 			$scope.input = {wholeMsg: Msg};

 	}

	//CUSTOM function adapted to new REST API
	$scope.addTodo = function () {
		var newTodo = {
			type: $scope.input.type,
			choices: [],
			tags: [],
			head: $scope.input.title,
			desc: $scope.input.desc,
			roomId: $scope.roomId,
		}
		//console.log(newTodo.type);

		//transform the choices
		for (var key in $scope.input.choices) {
			newTodo.choices.push($scope.input.choices[key].name);
		}
		//transform the tags
		for (var key in $scope.input.tags) {
			newTodo.tags.push($scope.input.tags[key].text);
		}
		// No input, so just do nothing
		if (!newTodo.head.length) {
			return;
		};

		$http.post(backendUrl + '/api/questions', newTodo)
		.success(function(data) {
			// remove the posted question in the input
			$scope.input = {
				type: $scope.input.type, //keep it unchanged
				choices: [{name:""}],
				tags: [],
				title: "",
				desc: "",
			}
			getQuestions();
	    })
	    .error(function(data) {
	        console.log('Error: ' + data);
	    });

	};

	$scope.addReply=function(todo){
		var newReply=todo.newReply.trim();

		console.log(newReply);
		$http.post(backendUrl + '/api/questions/'+ todo._id+'/reply', {replyContent: newReply})
		.success(function(data){
			getQuestions();
		})
		.error(function(data) {
	        console.log('Error: ' + data);
	    });


	}
	//vote up for a polling
	$scope.selectChoice=function(choice,todo){
		console.log(choice);

		$http.get(backendUrl+'/api/questions/' + todo._id + '/'+choice._id+'/vote-up')
		.success(function(data) {

			getQuestions();
			// Disable the button
			$scope.$storage[todo._id] = "selected";

		})
		.error(function(data) {
			console.log('Error: ' + data);
		});

	}

	// add poll questuin
	$scope.addChoice = function () {
		$scope.input.choices.push({name:""});
	};

	// total votes in one single poll function
	$scope.totalVotes=function(todo){
		$scope.totalVotes=0;
		$http.get(backendUrl + '/api/questions/'+todo._id)
		.success(function(data){
			data.choices.forEach(function(choice){
				$scope.totalVotes=$scope.totalVotes+choice.votes;
			});

		})
		.error(function(data){
			 console.log('Error: ' + data);
		});
	};




	// $scope.addImage = function () {
	// 	var newTodo= $scope.input.wholeMsg.trim();
	// 	var url=$scope.imgUrl;
	// 	console.log(url);
	// 	// No input, so just do nothing
	// 	if (!newTodo.length) {
	// 		return;
	// 	};
	// 	if (!url.length) {
	// 		return;
	// 	};
	// 	$http.post(backendUrl + '/api/questions', {wholeMsg: newTodo, roomId: $scope.roomId, type:'image',attachment: url })
	// 	.success(function(data) {
	// 		// remove the posted question in the input
	// 		$scope.input.wholeMsg = '';
	// 		$scope.imgUrl='';
	// 		getQuestions();
	//
	//     })
	//     .error(function(data) {
	//         console.log('Error: ' + data);
	//     });
	// };

	$scope.editTodo = function (todo) {
		$scope.editedTodo = todo;
		$scope.originalTodo = angular.extend({}, $scope.editedTodo);
	};

	//CUSTOM method for our new RESTAPI
	/*
	$scope.doneEditing = function (todo) {
		todo.desc = todo.desc.trim();
	 	if (todo.desc) {
	 		//update the todo
	 		$http.post(backendUrl+'/api/questions/'+todo._id, todo)
	 		.success(function(data) {
	 			$scope.editedTodo = null;
	 			getQuestions();
	 		})
			.error(function(data) {
	 			console.log('Error: ' + data);
	 		});
	 	} else {
	 		//remove the todo
	 		$scope.removeTodo(todo);
	 	}
	};
	*/
	//ADAPTED for RESTAPI
	$scope.addEcho = function (todo) {
		$http.get(backendUrl+'/api/questions/' + todo._id + "/add-echo")
		.success(function(data) {
			getQuestions();
			// Disable the button
			$scope.$storage[todo._id] = "echoed";
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});
	};

	$scope.minusEcho = function (todo) {
		$http.get(backendUrl+'/api/questions/' + todo._id + "/minus-echo")
		.success(function(data) {
			getQuestions();
			delete $scope.$storage[todo._id];
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});
	};
	$scope.voteDown = function (todo) {
		$http.get(backendUrl+'/api/questions/' + todo._id + "/vote-down")
		.success(function(data) {
			getQuestions();
			// Disable the button
			$scope.$storage[todo._id] = "voteddown";
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});
	};
	$scope.voteDownCancel = function (todo) {
		$http.get(backendUrl+'/api/questions/' + todo._id + "/vote-down-cancel")
		.success(function(data) {
			getQuestions();
			delete $scope.$storage[todo._id];
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});
	};

	// $scope.revertEditing = function (todo) {
	// 	todo.wholeMsg = $scope.originalTodo.wholeMsg;
	// 	$scope.doneEditing(todo);
	// };

	//CUSTOM method for new RESTAPI
	$scope.removeTodo = function (todo) {
		$http.delete('/api/questions/'+todo._id)
		.success(function(data) {
			//reload the todos
	        getQuestions();
	        console.log(data);
	    })
	    .error(function(data) {
	        console.log('Error: ' + data);
	    });
	};
/*
	$scope.clearCompletedTodos = function () {
		$scope.todos.forEach(function (todo) {
			if (todo.completed) {
				$scope.removeTodo(todo);
			}
		});
	};

	$scope.toggleCompleted = function (todo) {
		todo.completed = !todo.completed;
		$scope.doneEditing(todo);
	};
*/

	// $scope.markAll = function (allCompleted) {
	// 	$scope.todos.forEach(function (todo) {
	// 		todo.completed = allCompleted;
	// 		$scope.doneEditing(todo);
	// 	});
	// };
	//ADAPTED for RESTAPI


	/*
	$scope.FBLogin = function () {
		var ref = new Firebase(firebaseURL);
		ref.authWithOAuthPopup("facebook", function(error, authData) {
			if (error) {
				console.log("Login Failed!", error);
			} else {
				$scope.$apply(function() {
					$scope.$authData = authData;
					$scope.isAdmin = true;
				});
				console.log("Authenticated successfully with payload:", authData);
			}
		});
	};
	$scope.FBLogout = function () {
		var ref = new Firebase(firebaseURL);
		ref.unauth();
		delete $scope.$authData;
		$scope.isAdmin = false;
	};
	*/

	$scope.increaseMax = function () {
		if ($scope.maxQuestion < $scope.totalCount) {
			$scope.maxQuestion+=scrollCountDelta;
		}
	};

	$scope.toTop =function toTop() {
		$window.scrollTo(0,0);
	};

	// Not sure what is this code. Todel
	if ($location.path() === '') {
		$location.path('/');
	}
	$scope.location = $location;

	// autoscroll
	angular.element($window).bind("scroll", function() {
		if ($window.innerHeight + $window.scrollY >= $window.document.body.offsetHeight) {
			/*
			console.log('Hit the bottom2. innerHeight' +
			$window.innerHeight + "scrollY" +
			$window.scrollY + "offsetHeight" + $window.document.body.offsetHeight);
			*/
			// update the max value
			$scope.increaseMax();

			// force to update the view (html)
			$scope.$apply();
		}
	});
	//Return facebook username
	$scope.returnFBusername = function(){

		//var defer = $q.defer();
		$http.get('/api/users/current')
		.success(function(result){
			if(! result){
				console.log("Sorry you have to login");
			}
			else{
				//console.log(result.fb.name);
				$scope.username = result.fb.name;
			}
		})
		.error(function(result){
			console.log("error");
		});
	};
	/*$scope.$on('$viewContentLoaded', function() {
		returnFBusername();
    //call it here
	});*/

	// This function exists for testing
	$scope.getFirstAndRestSentence = function($string) {
	var head = $string;
	var desc = "";

	var separators = [". ", "? ", "! ", '\n'];

	var firstIndex = -1;
	for (var i in separators) {
		var index = $string.indexOf(separators[i]);
		if (index == -1) continue;
		if (firstIndex == -1) {firstIndex = index; continue;}
		if (firstIndex > index) {firstIndex = index;}
	}

	if (firstIndex !=-1) {
		head = $string.slice(0, firstIndex+1);
		desc = $string.slice(firstIndex+1);
	}
	return [head, desc];
};

}]);

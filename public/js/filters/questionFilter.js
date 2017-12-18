/*global todomvc, angular, Firebase */
'use strict';

/**
* The questionFilter
* Show the new questions on the top and show only max questions 
*
*/
function parseTwitterDate(text) {
return new Date(Date.parse(text.replace(/( +)/, ' UTC$1')));
}
todomvc.filter('questionFilter', function () {
  return function (input, max) {
    var sorted = [];
    var newQuestions = [];
    var sortedCount = 0;

    angular.forEach(input, function (todo) {
      if (parseTwitterDate(todo.createdAt)> new Date().getTime() - 180000) { // 3min
        todo.new = true;
        newQuestions.push(todo);
      } else if (sortedCount++<=max){  // show top n only.
        todo.new = false;
        sorted.push(todo);
      }

      // sorting new questions based on the time if echo is the same.
      // Newer ones are on the top
      newQuestions.sort(function(a, b) {
        if (a.echo == b.echo) {
          return b.createdAt - a.createdAt;
        }
        return b.echo - a.echo;
      });
    });

    // Combined list
    return newQuestions.concat(sorted);
  };
});
/*
todomvc.filter('questionFilter_3',function(){
  return function(inputArray){
        var array = [];
        for(var i=0;i<inputArray.length;i++){
            if(inputArray[i].type==='question'){
                array.push(inputArray[i]);
            }
        }
        for(var i=0;i<inputArray.length;i++){
            if(inputArray[i].type==='polling'){
                array.push(inputArray[i]);
            }
        }
        return array;
    }

});
*/
todomvc.filter('questionFilter_1',function(){
  return function(inputArray){
        var array = [];
        for(var i=0;i<inputArray.length;i++){
            if(inputArray[i].type !='polling'){
                array.push(inputArray[i]);
            }
        }
        return array;
    }

});


todomvc.filter('questionFilter_2',function(){
  return function(inputArray,tags){
        var array = [];
        for(var i=0;i<inputArray.length;i++){
            if(inputArray[i].type !='question'){
                array.push(inputArray[i]);
            }
        }
        return array;
    }

});


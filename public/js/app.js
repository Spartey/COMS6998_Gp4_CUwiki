/*global angular */
/*jshint unused:false */
'use strict';

/**
* The main TodoMVC app module
*
* @type {angular.Module}
*/
var todomvc = angular.module('todomvc', ['ngStorage', 'textAngular', 'ngTagsInput']);

/*
angular.module('todomvc').config(function($locationProvider){
    $locationProvider.html5Mode(true).hashPrefix('!');
});
angular.module('todomvc').run(function($FB){
  $FB.init('YOUR_APPID');
});
*/

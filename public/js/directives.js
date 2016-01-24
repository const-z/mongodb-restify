// <div ng-app="myapp">
//     <div ng-controller="TreeCtrl">
//         <tree family="treeFamily">
           
//         </tree>
//     </div>
// </div>
    
// var module = angular.module("appModule", []);

// module.directive("tree", function($compile) {
//     return {
//         restrict: "E",
//         transclude: true,
//         scope: {family: '='},
//         template:       
//             '<ul>' + 
//                 '<li ng-transclude></li>' +
//                 '<p ng-repeat="(key, value) in family">{{key}} : {{value}}</p>'+
                
//                 '<li ng-repeat="child in family.children">' +
//                     '<tree family="child"></tree>' +
//                 '</li>' +
//             '</ul>',
//         compile: function(tElement, tAttr, transclude) {
//             var contents = tElement.contents().remove();
//             var compiledContents;
//             return function(scope, iElement, iAttr) {
//                 if(!compiledContents) {
//                     compiledContents = $compile(contents, transclude);
//                 }
//                 compiledContents(scope, function(clone, scope) {
//                          iElement.append(clone); 
//                 });
//             };
//         }
//     };
// });
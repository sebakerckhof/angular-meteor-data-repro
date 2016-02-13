const Foos = new Mongo.Collection("foos");
const Bars = new Mongo.Collection("bars");

if (Meteor.isClient) {

  angular.module('demo', ['angular-meteor'])
      .component('fooList', {
        transclude: true,
        template: `
          <ul>
          <li ng-repeat="foo in $ctrl.foos track by foo._id" ng-class="{selected:foo.selected}" ng-click="$ctrl.selectFoo(foo)">{{::foo.name}}</li>
          </ul>
          <foo-details ng-if="$ctrl.selected" foo-id="$ctrl.selected"></foo-details>
        `,
        controller:['$scope','$reactive','$timeout',function($scope,$reactive,$timeout){
          $reactive(this).attach($scope);
          this.$onInit = function() {
            this.subscribe('foos');
            this.subscribe('bars');
            this.selected = null;
          };

          $timeout(() => { this.someField = 'baz' }, 1000);
          this.helpers({
            foos: () => {
              console.log('calling foos');
              return Foos.find({})
            },
            bars: () => {
              console.log('calling bars');
              return Bars.find({ name: this.getReactively('someField') })
            }
          });

          this.selectFoo = foo => {
            this.foos.filter(foo => foo.selected).forEach(foo => {delete foo.selected});
            foo.selected = true;
            this.selected = foo._id;
          }

        }]
      })
      .component('fooDetails', {
        bindings: {
          fooId: '='
        },
        controller:['$scope','$reactive',function($scope,$reactive){
          $reactive(this).attach($scope);

          this.$onInit = function() {
            this.subscribe('foo',()=>[this.getReactively('fooId')]);
          };

          this.helpers({
            foo: () => {
              console.log('calling foo');
              return Foos.findOne({ _id: this.getReactively('fooId') })
            }
          });


        }],
        template: `Details of {{ $ctrl.foo.name }}: {{ $ctrl.foo.description }}`
      });

  function onReady() {
    angular.bootstrap(document, ['demo'], {
      strictDi: true
    });
  }

  if (Meteor.isCordova)
    angular.element(document).on("deviceready", onReady);
  else
    angular.element(document).ready(onReady);
}

if (Meteor.isServer) {


  Meteor.publish('foos',function(){
    return Foos.find({},{fields:{description:0}});
  });
  Meteor.publish('foo',function(id){
    return Foos.find(id);
  });
  Meteor.publish('bars',function(){
    return Bars.find({},{fields:{description:0}});
  });

  Meteor.startup(function () {
    for(let i = 0; i < 20; i++){
      Foos.upsert(`foo${i}`,{name:`Foo ${i}`,description:`Foo ${i} ...`});
      Bars.upsert(`bar${i}`,{name:`Bar ${i}`,description:`Bar ${i} ...`});
    }
  });
}

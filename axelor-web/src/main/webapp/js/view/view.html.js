/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2005-2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
(function() {

"use strict";

var ui = angular.module('axelor.ui');

ui.HtmlViewCtrl = HtmlViewCtrl;
ui.HtmlViewCtrl.$inject = ['$scope', '$element', '$sce', '$interpolate'];

function HtmlViewCtrl($scope, $element, $sce, $interpolate) {

  var views = $scope._views;

  $scope.view = views.html;

  $scope.getContext = function () {
    var params = $scope._viewParams || {};
    var parent = $scope.$parent;
    return _.extend({}, params.context, parent.getContext ? parent.getContext() : {});
  };

  $scope.getURL = function () {
    var view = $scope.view;
    if (view) {
      var url = $scope.attr && $scope.attr('url') || view.name || view.resource;
      if (url && url.indexOf('{{') > -1) {
        url = $interpolate(url)($scope.getContext());
      }
      var stamp = new Date().getTime();
      var q = url.lastIndexOf('?');
      if (q > -1) {
        url += "&t" + stamp;
      } else {
        url += "?t" + stamp;
      }
      return $sce.trustAsResourceUrl(url);
    }
    return null;
  };

  $scope.show = function() {
    $scope.updateRoute();
  };

  $scope.$on('on:tab-reload', function(e, tab) {
    if ($scope === e.targetScope && $scope.onRefresh) {
      $scope.onRefresh();
    }
  });

  var refreshing = false;
  $scope.onRefresh = function () {
    if (refreshing) return;
    refreshing = true;

    var unwatch = $scope.$watch(function () {
      return $element.is(':hidden');
    }, function (hidden) {
      if (hidden) return;
      unwatch();

      $scope.waitForActions(function () {
        $scope.ajaxStop(function () {
          $scope.url = $scope.getURL();
          refreshing = false;
        });
      });
    });
  };

  $scope.onRefresh();

  $scope.$on("on:edit", function (event, rec) {
    if (rec && rec.id) {
      $scope.onRefresh();
    }
  });

  $scope.$on("on:new", function () {
    $scope.onRefresh();
  });

  $scope.getRouteOptions = function() {
    return {
      mode: "html"
    };
  };

  $scope.setRouteOptions = function(options) {
    $scope.updateRoute();
  };

  if ($scope._viewParams) {
    $scope._viewParams.$viewScope = $scope;
    $scope.show();
  }

  $scope.$applyAsync(function() {
    if ($scope.view.deferred) {
      $scope.view.deferred.resolve($scope);
    }
  });
}

var directiveFn = function(){
  return {
    controller: HtmlViewCtrl,
    replace: true,
    link: function (scope, element) {
      setTimeout(function () {
        element.parents('[ui-attach]').each(function () {
          $(this).scope().keepAttached = true;
        });
      }, 100);

      // XXX: chrome 76 issue? See RM-20400
      if (axelor.browser.chrome) {
        scope.$on('on:nav-click', function (e, tab) {
          if (tab.$viewScope !== scope) return;
          var iframe = element.find('iframe')[0];
          var embed = iframe.contentDocument ? iframe.contentDocument.body.firstChild : null;
          if (embed && embed.type === 'application/pdf' && embed.height === '100%') {
            embed.height = '101%';
            setTimeout(function () {
              embed.height = '100%';
            });
          }
        });
      }
    },
    template:
    '<div class="iframe-container">'+
      '<iframe ng-src="{{url}}" frameborder="0" scrolling="auto"></iframe>'+
    '</div>'
  };
};

ui.directive('uiViewHtml', directiveFn);
ui.directive('uiPortletHtml', directiveFn);

})();

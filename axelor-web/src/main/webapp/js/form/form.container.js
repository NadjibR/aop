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

// this directive is used as a replacement for ng-transclude directive
// which fails to keep scope hierarchy (see: https://github.com/angular/angular.js/issues/1809)
ui.directive('uiTransclude', function() {
  return {
    compile: function(tElement, tAttrs, transclude) {
      return function(scope, element, attrs, ctrl) {
        transclude(scope.$new(), function(clone) {
          element.append(clone);
        });
      };
    }
  };
});

ui.formWidget('Dashlet', {

  css: 'dashboard',

  showTitle: false,

  link: function(scope, element, attrs) {

    var field = scope.field;
    var dashlet = _.extend({}, scope.field);

    scope.dashlet = dashlet;
    scope.formPath = field.name || field.action;

    scope.$watch('attr("title")', function dashletTitleWatch(title, old) {
      if (title === old) {
        return;
      }
      var dashletScope = element.children('[ui-view-dashlet]').scope();
      if (dashletScope) {
        dashletScope.title = title;
      }
    });
  },

  template:
  '<div>'+
    '<div ui-view-dashlet></div>'+
  '</div>'
});

ui.formWidget('ButtonGroup', {

  link: function (scope, element, attrs) {
    function adjustButtons() {
      var visible = element.children('.btn:visible').length;
      if (visible) {
        element.children('.btn:visible')
          .css('max-width', (100.00/visible) + '%')
          .css('width', (100.00/visible) + '%');
      }
    }
    scope.$watch(adjustButtons);
    scope.$callWhen(function () {
      return element.is(':visible');
    }, adjustButtons);
  },
  transclude: true,
  template_editable: null,
  template_readonly: null,
  template:
    "<div class='btn-group' ui-transclude></div>"
});

ui.formWidget('Panel', {

  showTitle: false,

  link: function (scope, element, attrs) {

    var field = scope.field || {};
    var body = element.children(".panel-body");

    element.addClass(field.serverType);
    if (field.sidebar && !attrs.itemSpan) {
      attrs.$set('itemSpan', 12, true, 'x-item-span');
    }

    scope.menus = null;
    if (field.menu) {
      scope.menus = [field.menu];
    }

    scope.canCollapse = function() {
      return field.canCollapse || field.collapseIf;
    };

    scope.setCollapsed = function(collapsed) {
      var old = scope.collapsed;
      var action = collapsed ? "hide" : "show";

      scope.collapsed = collapsed;
      scope.collapsedIcon = collapsed ? 'fa-chevron-down' : 'fa-chevron-up';

      if (collapsed === old) {
        return;
      }

      element.removeClass("collapsed");
      body[action]("blind", 200, function () {
        element.toggleClass("collapsed", !!collapsed);
        if (body.css('display') !== 'none' && action === 'hide') {
          body.hide();
        }
        axelor.$adjustSize();
      });
    };

    scope.toggle = function() {
      if (scope.canCollapse()) {
        scope.setCollapsed(!scope.collapsed);
      }
    };

    scope.$watch("attr('collapse')", function panelCollapseWatch(collapsed) {
      scope.setCollapsed(collapsed);
    });

    var nested = element.parents('.panel:first').length > 0;
    if (nested) {
      element.addClass("panel-nested");
    }
    if (field.showFrame === false) {
      element.addClass('noframe');
    }
    scope.notitle = field.showFrame === false || field.showTitle === false;
    scope.title = field.title;
    scope.$watch('attr("title")', function panelTitleWatch(title, old) {
      if (title === undefined || title === old) return;
      scope.title = title;
    });

    var icon = field.icon;
    var iconBg = field.iconBackground;

    if (icon && icon.indexOf('fa-') === 0) {
      scope.icon = icon;
    } else if (icon) {
      scope.image = icon;
    }

    if (scope.icon && iconBg) {
      setTimeout(function() {
        var iconElem = element.children('.panel-header').children('.panel-icon');
        if (iconBg.indexOf("#") === 0) {
          iconElem.css('background-color', iconBg);
        } else {
          iconElem.addClass('bg-' + iconBg);
        }
        iconElem.addClass('has-bg');
        iconElem.find('i').addClass('fg-white');
      });
    }

    setTimeout(function () {
      var nestedJson = element.parents('.panel-json:first').length > 0;
      if (nestedJson) {
        element.removeClass("panel-nested");
      }
    });
  },

  transclude: true,
  template:
    "<div class='panel panel-default'>" +
      "<div class='panel-header' ng-click='toggle()' ng-if='!notitle &amp;&amp; field.title' ng-class=\"{'clickable-header' : canCollapse()}\" tabindex='-1'>" +
        "<div class='panel-icon' ng-if='icon'><i class='fa' ng-class='icon'></i></div>" +
        "<img class='panel-image' ng-if='image' ng-src='{{image}}'>" +
        "<div class='panel-title'><span ui-help-popover>{{title}}</span></div>" +
        "<div ng-if='menus' ui-menu-bar menus='menus' handler='this'></div>" +
        "<div ng-show='canCollapse()' class='panel-icons'>" +
          "<a href=''><i class='fa' ng-class='collapsedIcon'></i></a>" +
        "</div>" +
      "</div>" +
      "<div class='panel-body' ui-transclude></div>" +
    "</div>"
});

ui.formWidget('PanelStack', {
  transclude: true,
  template: "<div class='panel-stack'>" +
        "<span ui-transclude></span>" +
      "</div>"
});

ui.formWidget('PanelTabs', {

  link: function (scope, element, attrs) {

    scope.tabs = [];
    scope.more = null;

    element.find('> .tab-content > div').each(function (index) {
      var elem = $(this);
      var tab = {
        title: elem.attr('x-title'),
        selected: false,
        hidden: false,
        elem: elem,
        tabItem: $(),
        menuItem: $(),
        field: elem.scope().field
      };
      scope.tabs.push(tab);
    });

    var selected = null;
    var adjustPending = false;

    function findTab(tab) {
      var found = scope.tabs[tab] || tab;
      if (!found || _.isNumber(found)) {
        return null;
      }
      return found;
    }

    var doOnSelectPending = false;
    var doOnSelect = _.debounce(function () {
      if (doOnSelectPending) return;

      var elem = (selected || {}).elem;
      if (!elem) return;

      var elemScope = elem.scope && elem.scope();
      if (!elemScope) return;

      doOnSelectPending = true;
      scope.waitForActions(function () {
        if (elemScope.handleSelect) {
          elemScope.handleSelect();
        }
        doOnSelectPending = false;
      });
    }, 100);

    scope.selectTab = function(tab) {
      var current = selected;
      var found = findTab(tab);
      if (!found) {
        return;
      }
      scope.tabs.forEach(function (current) {
        current.selected = false;
        current.elem.hide();
      });

      selected = found;

      found.selected = true;
      found.elem.show();

      found.elem
        .add(found.tabItem)
        .add(found.menuItem)
        .addClass('active');

      setTimeout(function () {
        scope.$broadcast('tab:select');
        elemTabs.removeClass('open');
        elemMenu.removeClass('open');
        axelor.$adjustSize();
        if (current != selected) {
          doOnSelect();
        }
      });
    };

    scope.showTab = function (tab) {
      var found = findTab(tab);
      if (!found) {
        return;
      }

      adjustPending = true;

      found.hidden = false;
      found.tabItem.show();

      if (!selected || selected === found) {
        return scope.selectTab(found);
      }

      found.elem.hide();

      axelor.$adjustSize();
    };

    scope.hideTab = function (tab) {
      var found = findTab(tab);
      if (!found) {
        return;
      }

      adjustPending = true;

      var wasHidden = found.hidden;

      found.hidden = true;
      found.selected = false;
      found.elem.hide();

      found.tabItem.add(found.menuItem).hide().removeClass('active');

      if (!wasHidden && selected && selected !== found) {
        return axelor.$adjustSize();
      }

      var tabs = scope.tabs;
      for(var i = 0 ; i < tabs.length ; i++) {
        tab = tabs[i];
        if (!tab.hidden) {
          return scope.selectTab(tabs[i]);
        }
      }
      selected = null;
    };

    var lastWidth = 0;
    var lastTab = null;

    var elemTabs = $();
    var elemMenu = $();
    var elemMenuTitle = $();
    var elemMenuItems = $();

    function setup() {
      elemTabs = element.children('.nav-tabs').children('li:not(.dropdown)');
      elemMenu = element.children('.nav-tabs').children('li.dropdown');
      elemMenuTitle = elemMenu.children('a:first').children('span');
      elemMenuItems = elemMenu.find('li');

      _.each(scope.tabs, function (tab, index) {
        tab.tabItem = $(elemTabs[index]);
        tab.menuItem = $(elemMenuItems[index]);
      });
    }

    var setMenuTitle = (function() {
      var setActive = _.debounce(function(selected) {
        elemMenu.toggleClass('active', !!selected);
      });
      return function setMenuTitle(selected) {
        elemMenu.show();
        elemMenuTitle.html(selected && selected.title);
        setActive(selected);
      };
    }());

    function adjust() {
      if (elemTabs === null || !scope.tabs || element.is(":hidden")) {
        return;
      }

      var parentWidth = element.width() - 2;
      if (parentWidth === lastWidth && lastTab === selected && !adjustPending) {
        return;
      }
      lastWidth = parentWidth;
      lastTab = selected;

      elemTabs.parent().css('visibility', 'hidden');
      elemMenu.hide();

      // show visible tabs
      scope.tabs.forEach(function (tab, i) {
        if (tab.hidden) {
          $(elemTabs[i]).hide();
        } else {
          $(elemTabs[i]).show();
        }
      });

      if (elemTabs.parent().width() <= parentWidth) {
        elemTabs.parent().css('visibility', '');
        return;
      }

      setMenuTitle(null);

      var elem = null;
      var index = elemTabs.length;
      var selectedIndex = scope.tabs.indexOf(selected);

      while (elemTabs.parent().width() > parentWidth) {
        elem = $(elemTabs[--index]);
        elem.hide();
        if (index === selectedIndex) {
          setMenuTitle(selected);
        }
      }

      elemMenuItems.hide();
      var tab = null;
      while(index < scope.tabs.length) {
        tab = scope.tabs[index++];
        if (!tab.hidden) {
          tab.menuItem.show();
        }
      }

      elemTabs.parent().css('visibility', '');
    }

    var adjusting = false;
    scope.$onAdjust(function() {
      if (adjusting) { return; }
      try {
        adjusting = true;
        adjust();
      } finally {
        adjusting = false;
        adjustPending = false;
      }
    }, 10);

    scope.$timeout(function() {
      setup();
      var first = _.find(scope.tabs, function (tab) {
        return !tab.hidden;
      });
      if (first) {
        scope.selectTab(first);
      }
    });

    scope.$on('on:edit', function (e, record) {
      if (scope.record === record && !doOnSelectPending) {
        scope.ajaxStop(doOnSelect, 100);
      }
    });

    scope.$watch(function tabsWatch() {
      var hidden = scope.attr('hidden');
      if (hidden) return;
      // show selected tab only
      scope.tabs.forEach(function (tab) {
        if (!tab.selected) tab.elem.hide();
      });
    });
  },

  transclude: true,
  template:
    "<div class='panel-tabs tabbable-tabs'>" +
      "<ul class='nav nav-tabs nav-tabs-responsive'>" +
        "<li ng-repeat='tab in tabs' ng-class='{active: tab.selected}' ng-init='field = tab.field'>" +
          "<a tabindex='-1' href='' ng-click='selectTab(tab)'>"+
            "<span ng-if='field.type != \"panel\"' ng-bind-html='tab.title'></span>"+
            "<span ng-if='field.type == \"panel\"' ui-help-popover><span ng-bind-html='tab.title'></span></span>"+
          "</a>" +
        "</li>" +
        "<li class='dropdown' style='display: none'>" +
          "<a tabindex='-1' href='' class='dropdown-toggle' data-toggle='dropdown'><span></span><b class='caret'></b></a>" +
          "<ul class='dropdown-menu pull-right'>" +
            "<li ng-repeat='tab in tabs' ng-class='{active: tab.selected}'>" +
              "<a tabindex='-1' href='' ng-click='selectTab(tab)' ng-bind-html='tab.title'></a>" +
            "</li>" +
          "</ul>" +
        "</li>" +
      "</ul>" +
      "<div class='tab-content' ui-transclude></div>" +
    "</div>"
});

ui.formWidget('PanelTab', {

  link: function (scope, element, attrs) {

    var index = element.parent().children().index(element);
    var tab = null;
    var isHidden = scope.isHidden;

    function findTab() {
      return tab || (tab = (scope.tabs||[])[index]) || {};
    }

    scope.handleSelect = function () {
      var onTabSelect = scope.$events.onTabSelect;
      if (onTabSelect && !element.is(":hidden")) {
        onTabSelect();
      }
    };

    scope.isHidden = function () {
      var tab = findTab();
      return !tab.selected || isHidden.call(scope);
    };

    scope.$watch("attr('title')", function tabTitleWatch(value) {
      var tab = findTab();
      tab.title = value;
    });

    scope.$watch("attr('hidden')", function tabHiddenWatch(hidden, old) {
      scope.$evalAsync(function () {
        if (hidden) {
          return scope.hideTab(index);
        }
        return scope.showTab(index);
      });
    });
  }
});

})();

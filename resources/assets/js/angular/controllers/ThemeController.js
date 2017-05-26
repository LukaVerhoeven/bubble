app.controller('ThemeController', function($scope, $http, API_URL, $rootScope) {
	$scope.initvalue = {color :"red", icon:"school",shortcut:"A"}
	$scope.NewTheme = $scope.initvalue;
	$scope.createNewTheme = function(valid, $event){
		if($scope.NewTheme.keywordString && $scope.NewTheme.name){
			$scope.closeForm($event, 'create');
			$scope.NewTheme.chatid = $rootScope.chatID;
			$scope.NewTheme.keywordString = $scope.NewTheme.keywordString.replace(/\s+/g,",").replace(/[^a-zA-Z0-9,@#]/g,'');
			$scope.NewTheme.keywordString = $scope.NewTheme.keywordString.replace(/[^a-zA-Z0-9,@#]/g,''); //sanitize
			if($scope.NewTheme.chatid){
				$rootScope.postRequest($scope.NewTheme ,'NewTheme', '');
				$scope.resetForm($scope.NewTheme);
				$scope.NewTheme = $scope.initvalue;
				$rootScope.initShortcut();
			}
		}
	}

	$scope.editTheme = function(theme, $event){
		if(theme.keywordString && theme.name){
			$scope.closeForm($event, 'edit');
			theme.generalID = $rootScope.generalThemeID;
			$rootScope.postRequest(theme ,'updateTheme', '');
			$rootScope.initShortcut();
		}
	}


	$scope.resetForm = function(form){
	    for (var prop in form) {
	    	form[prop] = null;
	    }
	    $('#createThemeForm input').removeClass('valid');
	    $scope.createThemeForm.$setPristine();
	    $scope.createThemeForm.$setUntouched();
	}

	$rootScope.keywordToObjectArray = function(keywords){
        var keywordString = keywords.join(',');
        var objectString = keywordString.replace(/^/, '[{word:"').replace(/,/g, '"},{word:"').concat('"}]');
        objectString = objectString.replace(/([a-zA-Z0-9]+?):/g, '"$1":');
        objectString = objectString.replace(/'/g, '"');
        objectString = objectString.replace(/[\u0000-\u0019]+/g,""); // remove invisible symbols
        objectString = JSON.parse(objectString);
        return objectString;
	}

	$rootScope.updateMessages = function(keywords, color, themeid){
		var themeMessages = []
		// check if themeid is passed to this function
		// if (keywords[prop].theme_id) {
		// 	themeid = keywords[prop].theme_id;
		// }

		for ($prop in $rootScope.messages.items) {
			if($rootScope.messages.items[$prop].force_theme === 0){
				for (prop in keywords) {
					// if messages contains a keyword an has not been forced by  a theme => give new theme
					if($rootScope.messages.items[$prop].text.indexOf(keywords[prop].word) !== -1){
						$rootScope.messages.items[$prop].theme_id = themeid;
						$rootScope.messages.items[$prop].color = color;
						themeMessages.push($rootScope.messages.items[$prop].id);
					}
				}
			}else if ($rootScope.messages.items[$prop].force_theme === themeid) {
				$rootScope.messages.items[$prop].theme_id = themeid;
				$rootScope.messages.items[$prop].color = color;
			}
		}

		for ($prop in $rootScope.messages.items) {
			// if messages contains none of the keywords but has the themeID => remove the theme from it
			if ($rootScope.messages.items[$prop].theme_id == themeid && themeMessages.indexOf($rootScope.messages.items[$prop].id) === -1 && $rootScope.messages.items[$prop].force_theme === 0) {
				$rootScope.messages.items[$prop].theme_id = $rootScope.generalThemeID;
				$rootScope.messages.items[$prop].color = "white";
			}
		}
	}

	$rootScope.removeThemeFromMessages = function(themeid){
		for ($prop in $rootScope.messages.items) {
			if($rootScope.messages.items[$prop].theme_id == themeid){
				$rootScope.messages.items[$prop].theme_id = $rootScope.generalThemeID;
				$rootScope.messages.items[$prop].color = "white";
			}
		}
	}

	$rootScope.updateThemeUsage = function(){
		var countThemes = {};
		for (prop in $rootScope.messages.items) {
			if($rootScope.messages.items[prop].theme_id != $rootScope.generalThemeID){
				var id = $rootScope.messages.items[prop]['theme_id'];
				countThemes[id]++;
				if(isNaN(countThemes[id])){
					countThemes[id] = 1;
				}
			}
		}
		var amountMessages = Object.keys($rootScope.messages.items).length;
		if(!amountMessages){
			amountMessages = $rootScope.messages.items.length;
		}
		for (prop in $rootScope.themes) {
			var id = $rootScope.themes[prop].id;
			if(countThemes[id]){
				var usage = Math.round((countThemes[id]/amountMessages)*100) + "%"
				$rootScope.themes[prop].themeUsage = usage;
			}else {
				$rootScope.themes[prop].themeUsage = "0%";
			}
		}

	}

	$rootScope.initShortcut = function (){
		$scope.shortcuts = [];
		var shortcuts = $rootScope.adjustElementNewArray($rootScope.themes , 0,'shortcut', 'retreive',0,0,0);
		$rootScope.themes.forEach( function(element, index) {
			if(element.is_general !== 1 && element.is_active === 1 && element.is_deleted === 0){
				if(element.shortcut){
				    var code = element.shortcut.charCodeAt(0);
				    var msg = "The Key Code for the \""+element.shortcut+"\" character is "+code+".";
				    $scope.shortcut = {};
				    $scope.shortcut.code = code;
				    $scope.shortcut.themeid = element.id;
				    $scope.shortcut.color = element.color;
				    $scope.shortcuts.push($scope.shortcut);
				}
			}
		});
		$scope.useShortcut($scope.shortcuts);
	}

	$scope.useShortcut = function (shortcuts){
		$(document).keydown(function(evt){
			shortcuts.forEach( function(element, index) {
	    		if (evt.keyCode== element.code && (evt.ctrlKey)){
	   				evt.preventDefault();
	   				$scope.$apply(function() {
		    			$rootScope.message.filter = element.themeid;
		    			$rootScope.messageColor(element.color);
	   				});
	    		}
			});
			if (evt.keyCode== 27){
   				evt.preventDefault();
   				$scope.$apply(function() {
	    			$rootScope.message.filter = undefined;
	    			$rootScope.messageColor('');
   				});
    		}
		});
	}

	$scope.closeForm = function(e, action){
        e.stopPropagation();
        var currentElement = $(e.currentTarget);
        if(action === 'edit'){
	        var parent = currentElement.parents('.js-theme-card')
	        var status = parent.find('.js-theme-status');
	        parent.find('.js-toggle-edit-menu').removeClass('exit-theme');
	        parent.removeClass('open');
	        // status message
			status.css('color','#26a69a');
            status.html('Theme saved');
            status.removeClass('hidden').addClass('fadeout');

        }else if (action === 'create') {
	        var parent = currentElement.parents('.js-slide-menu');
	        parent.find('.js-toggle-slide-menu').removeClass('close');
	        parent.removeClass('open-slider');
        }
	}
})
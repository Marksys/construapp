import angular from 'angular'
import 'angular-ui-router'
import 'checklist-model'
var $ = require('jquery')

angular.module('construApp', ["ui.router", "ngMask", "checklist-model", "flow"])
.directive('userPhone', function() {
  return {
    restrict : "E",
    templateUrl: 'account/user-phone.html',
    scope: {
      phone: '=',
      name: '@'
    }
  }
})
.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                var reader  = new FileReader();
                reader.onloadend = function () {
                  scope.profilePic = reader.result;
                  scope.$apply();  
                };            
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });                
                reader.readAsDataURL(element[0].files[0]);
            });
        }
    };
}])
.config(($stateProvider, $urlRouterProvider) => {
  $urlRouterProvider.otherwise('/login')
  $stateProvider
    .state('login',{
      url:'/login',
      templateUrl:'account/login.html',      
      controller: ($state, $http, $scope, $window) => {        
        
        $scope.authenticate = function(user){ 
          
          if(!user || !user.username || !user.password){
                $scope.showError = true;
                $scope.message = 'Digite usuário e senha para entrar.';
                return false;
          } 

          $http({method: 'POST', url: 'authenticate/', data: {user}}).then(function(data) {           
              if(data.data.invalid){
                $scope.showError = true;
                $scope.message = 'Usuário ou senha inválidos.';
              } 
              else {
                $window.sessionStorage["userInfo"] = JSON.stringify(data.data);
                $state.go('home'); //redirect
              }
          }, function errorCallback(response) {
                $scope.showError = true;
                $scope.message = 'Ocorreu um erro no servidor';
            }
          );
        };
      },
      authenticate: false     
    })
    .state('createUser',{
      url:'/createUser',
      templateUrl:'account/create-user.html',
      controller: ($state, $http, $scope, $compile) => {
        $scope.profileFlow = {};
        $scope.user = { phones: [''], document : { type: 'CPF'} };
        $scope.telNum = 1;
        $scope.scopes = [];
        $scope.states = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RO", "RS", "RR", "SC", "SE", "SP", "TO"];
        $scope.professions = ["Serviço de Pedreiro e Alvenaria","Serviço de Elétrica","Serviço de Gesseiro","Serviço de Hidráulica","Serviço de Marcenaria","Serviço de Pintura","Serviço de Serralheria","Reformas em Geral"];
        $scope.targetpublic = ["Pequenas Reformas", "Socorro 24 Horas", "Construção", "Grandes Obras"];
        $scope.workingdays = ["Somente Dias Úteis", "Segunda a Sabado", "Segunda a Domingo"];
        $scope.workinghours = ["Horário Comercial", "Atendimento 24 Horas"];
        $scope.profilePic = "images/builder.jpg";
        
        $scope.addTel = function(){         
          var newScope = $scope.$new();
          $("#dynamicTel").append(
            $compile(
                "<div id='phone"+ $scope.telNum +"'>"
              +   "<user-phone phone='user.phones["+ $scope.telNum +"]' name='phone"+ $scope.telNum +"'></user-phone>"
              +   "<small ng-show='userForm.phone"+ $scope.telNum +".$error.pattern && userForm.phone"+ $scope.telNum +".$touched'>Telefone inválido</small>"
              +   "<small ng-show='userForm.phone"+ $scope.telNum +".$error.required && userForm.phone"+ $scope.telNum +".$touched'>Insira um telefone</small>"
              +   "<small ng-show='!userForm.phone"+ $scope.telNum +".$error.pattern && !userForm.phone"+ $scope.telNum +".$error.required "
              +     "&& userForm.phone"+ $scope.telNum +".$touched && userForm.phone"+ $scope.telNum +"_type.$error.required'>"
              +     "Tipo de telefone é obrigatório</small>"
              + "</div>"
            )(newScope)
          );
          $scope.telNum += 1;
          $scope.scopes.push(newScope);
          $scope.user.phones = $scope.user.phones.filter(function(e){return e});
        };
        
        $scope.delTel = function(){
            if($scope.telNum > 1)
            {
              $scope.telNum -= 1;
              var newScope = $scope.scopes.pop();   
              $scope.user.phones[$scope.telNum] = null;
              $scope.user.phones = $scope.user.phones.filter(function(e){return e});
              newScope.$destroy();
              $("#phone"+ $scope.telNum).remove();
            }        
        };
              
        $scope.createUser = function(user, isValid){
          if(isValid)
          {
              if($scope.fileUpload){
                  
                  var fd = new FormData();
                  fd.append('file', $scope.fileUpload);
                  fd.append('public_id', $scope.user.profilePic);
                  for ( var key in user ) {
                      fd.append(key, user[key]);
                  };

                  $http.post('createUser/', fd, {
                      transformRequest: angular.identity,
                      headers: {'Content-Type': undefined }
                  }).success(function(res){
                      $scope.showSuccess = true;
                      $scope.messageSuccess = 'Usuário criado com sucesso.';
                      $scope.userForm.$setPristine(); //não está funcionando, arrumar
                  })
                  .error(function(){
                    $scope.showError = true;
                    $scope.messageError = 'Não foi possível criar seu usuário.';
                  });
              };
          }
          else{
              $scope.showError = true;
              $scope.messageError = 'Não foi possível criar seu usuário.';
          }
        };
        
        $scope.getCep = function(){          
          var cep = $scope.user.adress.cep;         
          if(cep) {             
            cep = cep.replace(/\D/g, ''); //apenas números
            var cepValidate = /^[0-9]{8}$/;
          
            if(cepValidate.test(cep))
            {
              var url = "https://viacep.com.br/ws/"+ cep + "/json/?callback=?";
            
              $.getJSON(url, function(data) {
                  if (!("erro" in data)) {
                    $scope.user.adress.city = data.localidade;
                    $scope.user.adress.street = data.logradouro;
                    $scope.user.adress.state = data.uf;
                    $scope.user.adress.district = data.bairro;
                    $scope.user.adress.cep = data.cep;
                    $scope.$apply();
                  }
                });
            }
          }
        };
        
        $scope.validDocument = function() {
          
          if($scope.user.document.type == 'CPF'){
            var Objcpf = $scope.user.document.number;
            
            let strCPF = Objcpf.replace(/[^\d]+/g,'');           
            var Soma;
            var Resto;
            Soma = 0;
            if (strCPF == "00000000000" || !strCPF) return false;

            for (let i=1; i<=9; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (11 - i);
            Resto = (Soma * 10) % 11;

            if ((Resto == 10) || (Resto == 11))  Resto = 0;
            if (Resto != parseInt(strCPF.substring(9, 10)) ) return false;

            Soma = 0;
            for (let i = 1; i <= 10; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (12 - i);
            Resto = (Soma * 10) % 11;

            if ((Resto == 10) || (Resto == 11))  Resto = 0;
            if (Resto != parseInt(strCPF.substring(10, 11) ) ) return false;
            return true;
          }
          else if($scope.user.document.type == 'CNPJ'){
            
            var Objcnpj = $scope.user.document.number;
            
            let cnpj = Objcnpj.replace(/[^\d]+/g,'');
 
            if(cnpj == '') return false;
            
            if (cnpj.length != 14)
                return false;
        
            // Elimina CNPJs invalidos conhecidos
            if (cnpj == "00000000000000" || 
                cnpj == "11111111111111" || 
                cnpj == "22222222222222" || 
                cnpj == "33333333333333" || 
                cnpj == "44444444444444" || 
                cnpj == "55555555555555" || 
                cnpj == "66666666666666" || 
                cnpj == "77777777777777" || 
                cnpj == "88888888888888" || 
                cnpj == "99999999999999")
                return false;
         
              // Valida DVs
              let tamanho = cnpj.length - 2
              let numeros = cnpj.substring(0,tamanho);
              let digitos = cnpj.substring(tamanho);
              let soma = 0;
              let pos = tamanho - 7;
              for (let i = tamanho; i >= 1; i--) {
                soma += numeros.charAt(tamanho - i) * pos--;
                if (pos < 2)
                      pos = 9;
              }
              let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
              if (resultado != digitos.charAt(0))
                  return false;
                  
              tamanho = tamanho + 1;
              numeros = cnpj.substring(0,tamanho);
              soma = 0;
              pos = tamanho - 7;
              for (let i = tamanho; i >= 1; i--) {
                soma += numeros.charAt(tamanho - i) * pos--;
                if (pos < 2)
                      pos = 9;
              }
              resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
              if (resultado != digitos.charAt(1))
                    return false;
                    
              return true;
          };
          
          return false;
        };
      },     
      authenticate: false          
    })
     .state('home',{
      url:'/home',
      templateUrl:'home/index.html',    
      controller: ($scope, $window) => {
          var data = JSON.parse( $window.sessionStorage.getItem('userInfo'));         
          $scope.name = data.name;
          $scope.email = data.email;
      },
      controllerAs:"homeCtrl",
      authenticate: true
    })
    .state('sports', {
      url: '/sports',
      templateUrl: 'sports/sports-nav.html',
      resolve: {
        sportsService: function($http) {
          return $http.get('/sports');
        }
      },
      controller: function(sportsService, $location) {
        this.sports = sportsService.data;

        this.isActive = (sport) => {
          let pathRegexp = /sports\/(\w+)/;
          let match = pathRegexp.exec($location.path());
          
          if(match === null || match.length === 0) return false;
          let selectedSportName = match[1];

          return sport === selectedSportName;

        };
      },
      controllerAs: 'sportsCtrl'
    })
    .state('sports.medals', {
      url: '/:sportName',
      templateUrl: 'sports/sports-medals.html',
      resolve: {
        sportService: function($http, $stateParams) {
          return $http.get(`/sports/${$stateParams.sportName}`);
        }
      },
      controller: function(sportService){
        this.sport = sportService.data;
      },
      controllerAs: 'sportCtrl'
    })
    .state('sports.new', {
      url: '/:sportName/medal/new',
      templateUrl: 'sports/new-medal.html',
      controller: function($stateParams, $state, $http){
        this.sportName = $stateParams.sportName;

        this.saveMedal = function(medal){
          $http({method: 'POST', url: `/sports/${$stateParams.sportName}/medals`, data: {medal}}).then(function(){
            $state.go('sports.medals', {sportName: $stateParams.sportName});
          });
        };
      },
      controllerAs: 'newMedalCtrl'
    })
})
.factory('AuthenticateFactory', function($window) {
  return {
   isAuthenticated : function(){
      var data = JSON.parse( $window.sessionStorage.getItem('userInfo'));
      if(data)
        return true;
      else
        return false;
    } 
  }
})
.run(function ($rootScope, $state, AuthenticateFactory) {
  $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
    if (toState.authenticate && !AuthenticateFactory.isAuthenticated()){
      // User isn’t authenticated
      $state.transitionTo("login");
      event.preventDefault(); 
    }
  });
});

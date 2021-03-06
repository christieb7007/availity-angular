/* global describe, it, jasmine, expect, beforeEach, inject */

import $ from 'jquery';
import angular from 'angular';
import Tester from 'tester';
import '../';
import '../../validation';

describe('placeholder', () => {

  let $el;
  let placeholderSniffer = null;
  let $compile;
  let scope;
  const tester = new Tester();

  const fixtures = {
    'default': '<input type="text" id="test" placeholder="testing">',
    'model': '<input type="text" name="model" data-ng-model="demo.data" placeholder="testing">',
    'testValue': '<input type="text" placeholder="testing" value="test">'
  };

  beforeEach(() => {
    angular.mock.module('ng.shims.placeholder');
    angular.mock.module('availity', (avValProvider) => {
      avValProvider.addRules({
        default: {
          lastName: {
            size: {
              min: 2,
              max: 10,
              message: 'Last name must be between 2 and 10 characters.'
            },
            required: {
              message: 'Last name is required.'
            }
          },
          dateFormat: {
            format: 'MM/DD/YYYY',
            message: 'Format needs to be MM/DD/YYYY'
          }
        }
      });
    });
    angular.mock.module('availity.ui');
  });

  tester.directive();

  beforeEach(inject(function($injector, _placeholderSniffer_) {
    $compile = $injector.get('$compile');
    scope = $injector.get('$rootScope');
    scope.form = {};
    tester.$scope.demo = {};
    placeholderSniffer = _placeholderSniffer_;
    placeholderSniffer.hasPlaceholder = () => {
      return false; // force every browser to run the shim
    };
  }));

  it('should not dirty the value', function() {

    // why does this pass on travis but fails locally?
    // $el = tester.compileDirective(fixtures.default);
    // expect($el.val()).toEqual('testing');
    // expect($el.hasClass('empty')).toBe(true);

    const field = angular.element('<input type="text" id="test" placeholder="testing">');
    $compile(field)(scope);
    expect(field.val()).toBe('testing');
    expect(field.hasClass('empty')).toBe(true);
  });

  it('should not dirty the focused value', function() {
    $el = tester.compileDirective(fixtures.default);
    $el.triggerHandler('focus');
    expect($el.val()).toEqual('');
    expect($el.hasClass('empty')).toBe(false);
    $el.triggerHandler('blur');
  });

  it('should not dirty the model', function() {
    tester.$scope.demo = {
      data: ''
    };
    $el = tester.compileDirective(fixtures.model);
    tester.flush();
    expect(tester.$scope.demo.data).toEqual('');
  });

  it('should get value', function() {
    $el = tester.compileDirective(fixtures.testValue);
    expect($el.val()).toEqual('test');

  });

  describe('with validation', function() {

    beforeEach(function() {
      tester.$scope.demo = {};
      tester.$scope.demo.rules = 'default';

      const template = `
        <form name="myForm" data-av-val-form="default">
          <input data-ng-model="demo.lastName" name="lastName" type="text" data-av-val-field="lastName" placeholder="test"/>
        </form>`;

      $el = tester.compileDirective(template);
    });

    it('should be valid with model updated', function() {
      tester.$scope.myForm.lastName.$setViewValue('lastName');
      tester.$scope.$digest();

      expect(tester.$scope.myForm.lastName.$invalid).toBe(false);
      expect(tester.$scope.demo.lastName).toEqual('lastName');
    });

    it('should NOT be valid and model should NOT be updated', function() {
      tester.$scope.myForm.lastName.$setViewValue('1');
      tester.$scope.$digest();

      expect(tester.$scope.myForm.lastName.$invalid).toBe(true);
      expect(tester.$scope.demo.lastName).toBeUndefined();
    });
  });

  describe('with forms', function() {

    beforeEach(function() {

      tester.$scope.demo = {};
      tester.$scope.submit = jasmine.createSpy('submit');

      const template = `
        <form name="myForm" data-ng-submit="submit()" id="myForm">
          <input data-ng-model="demo.firstName" id="input1" name="firstName" type="text" placeholder="test"/>
          <input data-ng-model="demo.lastName" id="input2" name="lastName" type="text" placeholder="test"/>
          <input type="submit" id="submit" value="submit"/>
        </form>`;

      $el = tester.compileDirective(template);
    });

    it('should not dirty empty fields', function() {

      $el.triggerHandler('submit');
      tester.$scope.$digest();

      expect($('#input1').val()).toEqual('test');
      expect($('#input2').val()).toEqual('test');
      expect($('#input1').hasClass('empty')).toBe(true);
      expect($('#input2').hasClass('empty')).toBe(true);

      expect(tester.$scope.demo.firstName).toBeUndefined();
      expect(tester.$scope.demo.lastName).toBeUndefined();
      expect(tester.$scope.submit).toHaveBeenCalled();

    });

    it('should submit correct values', function() {

      $('#input1').val('Gary');
      $('#input2').val('Oak');
      $('#myForm').on('submit', function(e) {
        e.preventDefault();
        expect($('#input1').val()).toEqual('Gary');
        expect($('#input2').val()).toEqual('Oak');
      });
      $('#myForm').submit();
    });

    it('should be able to reset', function() {
      $('#input1').val('Gary');
      $('#input2').val('Oak');
      $('#myForm').on('submit', function(e) {
        e.preventDefault();
        expect($('#input1').val()).toEqual('');
        expect($('#input2').val()).toEqual('');
      });
      $('#myForm')[0].reset();
      $('#myForm').submit();
    });

  });

});

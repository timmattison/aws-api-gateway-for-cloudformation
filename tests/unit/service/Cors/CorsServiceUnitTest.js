'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var sinon = require('sinon');

var testSubject;

describe('Cors::CorsService', function () {

    var getMethodStub;
    var updateMethodResponseStub;
    var updateIntegrationResponseStub;
    var getCorsMethodUpdateOperationsStub

    var deleteMethodStub;
    var createMethodStub;

    after(function () {
        mockery.deregisterAll();
        mockery.disable();
    });
    before(function() {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });

        getMethodStub = sinon.stub();
        updateMethodResponseStub = sinon.stub();
        updateIntegrationResponseStub = sinon.stub();
        getCorsMethodUpdateOperationsStub = sinon.stub();

        deleteMethodStub = sinon.stub();
        createMethodStub = sinon.stub();

        var awsSdkStub = {
            APIGateway: function () {
                this.getMethod = getMethodStub;
                this.updateMethodResponse = updateMethodResponseStub;
                this.updateIntegrationResponse = updateIntegrationResponseStub;
            }
        };
        var apiMethodServiceStub = {
            deleteMethod: deleteMethodStub,
            createMethod: createMethodStub
        };

        mockery.registerMock('aws-sdk', awsSdkStub);
        mockery.registerMock('../ApiMethod/ApiMethodService', apiMethodServiceStub);
        mockery.registerMock('./GetCorsMethodUpdateOperations', getCorsMethodUpdateOperationsStub);
        testSubject = require('../../../../lib/service/Cors/CorsService');
    });

    var corsConfig;
    beforeEach(function () {
        deleteMethodStub.reset().resetBehavior();
        deleteMethodStub.yields(undefined, {});
        createMethodStub.reset().resetBehavior();
        createMethodStub.yields(undefined, {});
        getCorsMethodUpdateOperationsStub.reset().resetBehavior();
        getCorsMethodUpdateOperationsStub.yields(undefined, [{}]);

        getMethodStub.reset().resetBehavior();
        getMethodStub.yields(undefined, {});
        updateMethodResponseStub.reset().resetBehavior();
        updateMethodResponseStub.yields(undefined, {});
        updateIntegrationResponseStub.reset().resetBehavior();
        updateIntegrationResponseStub.yields(undefined, {});

        corsConfig = {
            allowMethods: ['GET', 'PUT'],
            allowOrigin: '*',
            allowHeaders: ['x-header'],
            exposeHeaders: ['x-expose'],
            maxAge: 123,
            allowCredentials: true
        };
    });

    describe('putOptionsMethod', function () {
        it('should create an OPTIONS method with full corsConfig', function (done) {
            testSubject.putOptionsMethod('RestApiId', 'ResourceId', corsConfig, function (error) {
                expect(error).to.be.undefined;
                done();
            });
        });
        it('should create an OPTIONS method with minimal corsConfig', function (done) {
            delete corsConfig.allowHeaders;
            delete corsConfig.exposeHeaders;
            delete corsConfig.maxAge;
            delete corsConfig.allowCredentials;
            testSubject.putOptionsMethod('RestApiId', 'ResourceId', corsConfig, function (error) {
                expect(error).to.be.undefined;
                done();
            });
        });
        it('should return error if deleteMethod fails', function (done) {
            deleteMethodStub.yields('deleteMethodError');
            testSubject.putOptionsMethod('RestApiId', 'ResourceId', corsConfig, function (error) {
                expect(error).to.equal('deleteMethodError');
                done();
            });
        });
        it('should return error if createMethod fails', function (done) {
            createMethodStub.yields('createMethodError');
            testSubject.putOptionsMethod('RestApiId', 'ResourceId', corsConfig, function (error) {
                expect(error).to.equal('createMethodError');
                done();
            });
        });
    });

    describe('updateCorsConfiguration', function () {
        var parameters;
        beforeEach(function () {
            parameters = {
                params: {
                    restApiId: 'RestApiId',
                    corsConfig: JSON.parse(JSON.stringify(corsConfig))
                },
                old: {
                    corsConfig: JSON.parse(JSON.stringify(corsConfig))
                }
            };
        });
        it('should successfully update cors configuration', function (done) {
            parameters.old.corsConfig.allowOrigin = 'http://example.com';
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.be.undefined;
                done();
            });
        });
        it('should successfully update cors configuration if origin and allowMethods has not changed', function (done) {
            parameters.old.corsConfig.allowHeaders = 'http://example.com';
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.be.undefined;
                done();
            });
        });
        it('should do nothing if there is no cors configuration', function (done) {
            delete parameters.params.corsConfig;
            delete parameters.old.corsConfig;
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.be.undefined;
                done();
            });
        });
        it('should do nothing if there are no cors configuration changes', function (done) {
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.be.undefined;
                done();
            });
        });
        it('should add new cors if no old cors is set', function (done) {
            delete parameters.old.corsConfig;
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.be.undefined;
                done();
            });
        });
        it('should fail is putMethod fails', function (done) {
            delete parameters.old.corsConfig;
            deleteMethodStub.yields('deleteError');
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.equal('deleteError');
                done();
            });
        });

        it('should successfully delete cors configuration', function (done) {
            delete parameters.params.corsConfig;
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.be.undefined;
                done();
            });
        });
        it('should return error if delete cors configuration fails', function (done) {
            delete parameters.params.corsConfig;
            deleteMethodStub.yields('deleteMethodError');
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.equal('deleteMethodError');
                done();
            });
        });
        it('should return error if update methods fails', function (done) {
            delete parameters.params.corsConfig;
            getCorsMethodUpdateOperationsStub.yields('getCorsMethodUpdateOperationsError');
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.equal('getCorsMethodUpdateOperationsError');
                done();
            });
        });
        it('should succeed if there are no methods to update', function (done) {
            delete parameters.params.corsConfig;
            getCorsMethodUpdateOperationsStub.yields(undefined, []);
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.be.undefined
                done();
            });
        });
        it('should succeed if there are methods to update', function (done) {
            delete parameters.params.corsConfig;
            getCorsMethodUpdateOperationsStub.yields(undefined, [{}]);
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.be.undefined
                done();
            });
        });

        it('should fail if updateMethodResponse fails', function (done) {
            parameters.params.corsConfig.allowOrigin = 'http://example.com';
            updateMethodResponseStub.yields('updateResponseError');
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.equal('updateResponseError');
                done();
            });
        });
        it('should succeed if updateMethodResponse fails with NotFoundException', function (done) {
            delete parameters.params.corsConfig;
            updateMethodResponseStub.yields({ code: 'NotFoundException' });
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.be.undefined
                done();
            });
        });

        it('should fail if updateIntegrationResponse fails', function (done) {
            parameters.params.corsConfig.allowOrigin = 'http://example.com';
            updateIntegrationResponseStub.yields('updateResponseError');
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.equal('updateResponseError');
                done();
            });
        });
        it('should succeed if updateIntegrationResponse fails with NotFoundException', function (done) {
            delete parameters.params.corsConfig;
            updateIntegrationResponseStub.yields({ code: 'NotFoundException' });
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.be.undefined
                done();
            });
        });

        it('should succeed if only update is a remove', function (done) {
            delete parameters.old.corsConfig;
            getCorsMethodUpdateOperationsStub.yields(undefined, [ { op: 'remove' } ]);
            testSubject.updateCorsConfiguration(parameters, 'ResourceId', function (error) {
                expect(error).to.be.undefined
                done();
            });
        });
    });
});
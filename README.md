# thoregon.crystalline

Transparent facade for services.

Enables developers to use remote services with simple async function
calls.

Services can be
- Workers
- thoregon services
- REST services
- implement others like CORBA, ...

The facade is built using a schema which defines the service API
 
 - ServiceFacade
    - use provider
    - ask provider for API
    - provider connects to service
    - facade ready

if a service needs authorization, the facade can provide the current user
or another identity is provided.
The provider implementation is responsible to do the authorization on request.  

` 
+---------------------+
|    ServiceFacade    |
+---------------------+
          |
          v
+---------------------+
| ServiceProviderImpl |
+---------------------+
          |
          ~  (there may be a process/memory/machine boundary)
          |
          v
+---------------------+
|    ServiceImpl      |
+---------------------+
`         

Provider Base Classes

    lib/provider/
        ServiceProvider
            - base class to communicate with the service impl
            - provides timeout features, use mandatory by services behind a boundary  
        JSProvider          
            - wraps a JS class/object and exposes the API, does not need a special Impl base class
        WorkerProvider
            - loads a worker
            - communicates with worker, query API      
        ThoregonProvider
            - connects to a thoregon message queue
            - the service impl is typically located on another node
        RESTProvider
            - connects to a REST Service
            - the service impl is typically located on another node

    Some services like REST or ThoregonService typically resides on another node. For providers
    accessing a service behind a boundary use timeouts for requests

Service Impl Base Classes

    lib/services/
        ServiceImpl
            - base class to communicate with the service provider
        WorkerServiceImpl       
            - wraps a JS class/object within a worker and exposes the API to the provider
            - 
        ThoregonServiceImpl     
            - wraps a JS class/object or Command to be connected to a thoregon message queue and exposes the API to the provider
            - typically located on another node than the consumer
        RESTServiceImpl
            - can be used as base class for REST implementatitons, exposes the API to the consumer
            - typically located on another node than the consumer

    A REST service is implemented in any language
    see evolux.web to easy create REST services based in JS class/object or Commands 
 

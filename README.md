Puppeteer Report
=========
Applicazione node che si occupa di stampare una pagina web in formato report attraverso l'utilizzo di puppeteer

https://github.com/puppeteer/puppeteer


## Routes
### /print/:tenantId/:templateId/:recordId
chiamata sincrona 
### /print/v2/:tenantId/:templateId/:recordId
ritorna il report v2

### /print/jobs/:tenantId/:templateId/:recordId
Inizia l'elaborazione asincrona del report
```
richiesta:
    - parametri:
        tenantId
        templateId
        recordId
    - query: 
        notify: true se si richiede l'invio di una mail alla terminazione, false altrimenti, defalut true
    - body: -
risposta:
    status: stato corrente della richiesta
    jobId: id del job che elabora la richiesta
```
### /print/jobs/status/:jobId/:tenantId
Ritorna lo stato della richiesta
```
richiesta:
    - parametri:
        jobId: id del job ritornato dalla chiamata precedente
        tenantId
risposta:
    status: stato corrente della richiesta
```
### /print/jobs/:jobId/:tenantId
Se la richiesta è stata completata ritorna il risultato come file
```
richiesta:
    - parametri:
        jobId: id del job ritornato dalla chiamata precedente
        tenantId
risposta:
    result: risultato della richiesta, ritornato solo in caso di successo
```

## Parametri di configurazione per le chiamate asincrone
- massimo numero di processi di elaborazione concorrenti
    numero massimo di worker job che eseguono le elaborazioni concorrentemente, in caso di ulteriori richieste queste vengono messe in pausa  
    ```MAX_CONCURRENT_PROCESSES: default 2```
- rate limiter della coda
    numero massimo di processi elaborati in un dato intervallo di tempo, per non sovraccaricare il servizio, ulteriori richieste vengono messe in pausa  
    ```limiter: defalut { max: 10, duration: 10000 }```
- retry in caso di fallimento
    numero di tentativi di elaborare la richiesta e delay in secondi tra i tentativi  
    ```attempts: default 1; backoff: default 10000```
- time to leave
    tempo di vita dei processi nella coda, in secondi; alla creazione di un nuovo job vengono rimossi tutti quelli scaduti
    è lo uguale al tempo per il quale resta attivo il presigned url e la vita dei file nel bucket s3  
    ```TTL: default 86400 (1gg)```
- notifica di defalut:
    parametro usato se la query non specifica il comportamento desiderato  
    ```DEFALUT_NOTIFY: true -> notifica tramite email, false -> nessuna notifica, bisogna inviare richieste per controllare lo status```
- bull dashboard: interfaccia per vedere una panoramica dei job, attiva solo nell'ambiente di sviluppo
package com.fogflow.fogfunction;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jetbrains.annotations.NotNull;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
public class RestHandler {
    String BrokerURL;

    private String outputEntityId;
    private String outputEntityType;

    @PostConstruct
    private void setup() {
        System.out.print("=========test========");
        String jsonText = System.getenv("adminCfg");
        this.handleInitAdminCfg(jsonText);
    }

    @PostMapping("/admin")
    public ResponseEntity<Void> handleConfig(@RequestBody List<Config> configs) {
        for (Config cfg : configs) {
            System.out.println(cfg.details.get("command"));
            if (cfg.details.get("command").equalsIgnoreCase("CONNECT_BROKER")) {
                this.BrokerURL = cfg.details.get("brokerURL");
            } else if (cfg.details.get("command").equalsIgnoreCase("SET_OUTPUTS")) {
                this.outputEntityId = cfg.details.get("id");
                this.outputEntityType = cfg.details.get("type");
            }
        }

        System.out.println(this.BrokerURL);
        System.out.println(this.outputEntityId);
        System.out.println(this.outputEntityType);

        return ResponseEntity.ok().build();
    }


    public void handleInitAdminCfg(String config) {
        ObjectMapper mapper = new ObjectMapper();

        try {
            List<Config> myAdminCfgs = mapper.readValue(config, new TypeReference<List<Config>>() {
            });
            this.handleConfig(myAdminCfgs);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @PostMapping("/notifyContext")
    public ResponseEntity<Void> handleNotify(@RequestBody Notification notify) {
        System.out.println(notify.subscriptionId);

        for (ContextElementResponse response : notify.contextResponses) {
            System.out.println(response.toString());
            if (response.statusCode.code == 200) {
                ContextObject contextObj = new ContextObject(response.contextElement);
                handleEntityObject(contextObj);
            }
        }

        return ResponseEntity.ok().build();
    }

    private void handleEntityObject(ContextObject entity) {
        FogFunction.function(entity, this);
    }

    void publishResult(@NotNull ContextObject resultEntity, boolean iot) {
        if (Objects.equals(resultEntity.id, "")) {
            resultEntity.id = outputEntityId;
        }

        if (Objects.equals(resultEntity.type, "")) {
            resultEntity.type = outputEntityType;
        }

        // send it to the nearby broker, assigned by FogFlow Broker
        RestTemplate restTemplate = new RestTemplate();

        try {
            URI uri = new URI(BrokerURL + "/updateContext");

            ContextElement element = new ContextElement(resultEntity);

            UpdateContextRequest request = new UpdateContextRequest();
            request.addContextElement(element);
            request.setUpdateAction("UPDATE");

            ObjectMapper mapper = new ObjectMapper();
            try {
                String json = mapper.writeValueAsString(request);

                HttpHeaders headers = new HttpHeaders();
                if (iot) {
                    headers.set("fiware-service", "openiot");
                    headers.set("fiware-servicepath", "/");
                }

                HttpEntity<String> entity = new HttpEntity<>(json, headers);

                ResponseEntity<ContextResponse> result = restTemplate.exchange(uri, HttpMethod.POST, entity, ContextResponse.class);

                System.out.println(result.getStatusCodeValue());
                System.out.println("JSON = " + json);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    List<ContextElement> queryContext(List<EntityId> entities, List<Scope> restrictions) {
        RestTemplate restTemplate = new RestTemplate();
        try {
            URI uri = new URI(BrokerURL + "/queryContext");

            QueryContextRequest request = new QueryContextRequest();
            request.entities = new ArrayList<>();
            for (EntityId entityId : entities) {
                request.entities.add(new EntityId(entityId.id, entityId.type, entityId.isPattern));
            }
            request.getScopes().addAll(restrictions);

            ObjectMapper mapper = new ObjectMapper();
            try {
                String json = mapper.writeValueAsString(request);
                System.out.println("JSON = " + json);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
            ResponseEntity<ContextResponse> result = restTemplate.postForEntity(uri, request, ContextResponse.class);
            System.out.println(result.getStatusCodeValue());

            if (result.getBody() != null) {
                return result.getBody().getContextResponses().parallelStream().map(ContextElementResponse::getContextElement).collect(Collectors.toList());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new ArrayList<>();
    }
}

package com.fogflow.fogfunction;

import org.jetbrains.annotations.NotNull;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

public class FogFunction {
    public static void function(@NotNull ContextObject entity, @NotNull RestHandler restHandler) {
        //Collections.singletonList(new Scope.StringQuery(""))
        List<ContextElement> queryResults = restHandler.queryContext(Collections.singletonList(
                new EntityId("PeopleCounter." + (Integer.parseInt(entity.id.split("\\.")[1]) + 1), null, false)),
                Collections.emptyList());

        /*String cmd = queryResults.parallelStream().findAny().map(e -> e.attributes.parallelStream())
                .flatMap(e -> e.filter(f -> f.name.equals("count")).findAny().map(f -> f.value.toString()))
                .orElse("Not found");*/

        String cmd = Optional.of(entity.attributes.get("count").value.toString()).orElse("Not found");
        publishCmd(cmd, entity, restHandler);

        String log = queryResults.parallelStream().findAny().map(e -> e.entityId.id).orElse("Not found");
        publishLog(log, entity, restHandler);
    }

    private static void publishCmd(@NotNull String value, @NotNull ContextObject entity, @NotNull RestHandler restHandler) {
        ContextObject resultEntity = new ContextObject();
        resultEntity.id = entity.id.replace("PeopleCounter", "EBoard");
        resultEntity.type = "EBoard";
        ContextAttribute attr = new ContextAttribute();
        attr.name = "next";
        attr.type = "command";
        attr.value = value;
        resultEntity.attributes.put("next", attr);
        restHandler.publishResult(resultEntity, true);
    }

    private static void publishLog(@NotNull String value, @NotNull ContextObject entity, @NotNull RestHandler restHandler) {
        ContextObject resultEntity = new ContextObject();
        resultEntity.id = entity.id.replace("PeopleCounter", "EBoard");
        resultEntity.type = "Result";
        ContextAttribute attr = new ContextAttribute();
        attr.name = "next";
        attr.type = "string";
        attr.value = value;
        resultEntity.attributes.put("next", attr);
        restHandler.publishResult(resultEntity, false);
    }
}

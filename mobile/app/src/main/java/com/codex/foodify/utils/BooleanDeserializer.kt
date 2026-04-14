package com.codex.foodify.utils

import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import com.google.gson.JsonParseException
import java.lang.reflect.Type

class BooleanDeserializer : JsonDeserializer<Boolean> {
    override fun deserialize(
        json: JsonElement,
        typeOfT: Type,
        context: com.google.gson.JsonDeserializationContext
    ): Boolean {
        return when {
            json.isJsonPrimitive -> {
                val primitive = json.asJsonPrimitive
                when {
                    primitive.isBoolean -> primitive.asBoolean
                    primitive.isNumber -> primitive.asInt != 0
                    primitive.isString -> {
                        val s = primitive.asString
                        s.equals("true", ignoreCase = true) || s == "1"
                    }
                    else -> false
                }
            }
            else -> false
        }
    }
}

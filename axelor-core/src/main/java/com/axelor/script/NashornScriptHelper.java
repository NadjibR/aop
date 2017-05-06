/**
 * Axelor Business Solutions
 *
 * Copyright (C) 2005-2017 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.script;

import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.axelor.rpc.Context;

public class NashornScriptHelper extends AbstractScriptHelper {

	private static Logger log = LoggerFactory.getLogger(GroovyScriptHelper.class);

	private final ScriptEngine engine;
	
	public NashornScriptHelper(ScriptBindings bindings) {
		this.setBindings(bindings);
		engine = new ScriptEngineManager().getEngineByName("nashorn");
		engine.setBindings(new NashornGlobals(engine), ScriptContext.GLOBAL_SCOPE);
	}

	public NashornScriptHelper(Context context) {
		this(new ScriptBindings(context));
	}

	@Override
	public Object eval(String expr) {
		try {
			engine.setBindings(getBindings(), ScriptContext.ENGINE_SCOPE);
			return engine.eval(expr);
		} catch (ScriptException e) {
			log.error("Script error: {}", expr, e);
		}
		return null;
	}

	@Override
	protected Object doCall(Object obj, String methodCall) {
		final ScriptBindings bindings = new ScriptBindings(getBindings());
		final ScriptHelper sh = new NashornScriptHelper(bindings);
		bindings.put("__obj__", obj);
		return sh.eval("__obj__." + methodCall);
	}
}

/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2005-2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
package com.axelor.script;

import com.axelor.common.StringUtils;
import com.axelor.rpc.Context;
import javax.script.Bindings;

public class CompositeScriptHelper extends AbstractScriptHelper {

  private GroovyScriptHelper gsh;
  private ELScriptHelper esh;

  public CompositeScriptHelper(Bindings bindings) {
    this.setBindings(bindings);
  }

  public CompositeScriptHelper(Context context) {
    this(new ScriptBindings(context));
  }

  private ScriptHelper getGSH() {
    if (gsh == null) {
      gsh = new GroovyScriptHelper(this.getBindings());
    }
    return gsh;
  }

  private ScriptHelper getESH() {
    if (esh == null) {
      esh = new ELScriptHelper(this.getBindings());
    }
    return esh;
  }

  private String strip(String expr) {
    String str = expr.trim();
    return str.substring(2, str.length() - 1);
  }

  private boolean isEL(String expr) {
    if (StringUtils.isBlank(expr)) {
      return true;
    }
    String str = expr.trim();
    return str.startsWith("#{") && str.endsWith("}");
  }

  @Override
  public Object call(Object obj, String methodCall) {
    // allways use EL
    return getESH().call(obj, methodCall);
  }

  @Override
  protected Object doCall(Object obj, String methodCall) {
    return null;
  }

  @Override
  public Object eval(String expr, Bindings bindings) throws Exception {
    return isEL(expr) ? getESH().eval(strip(expr), bindings) : getGSH().eval(expr, bindings);
  }
}

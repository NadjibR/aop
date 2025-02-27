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
package com.axelor.db.tenants;

import java.io.IOException;
import java.util.Map;
import javax.inject.Singleton;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import org.apache.shiro.web.util.WebUtils;

/**
 * The {@link PostSessionTenantFilter} is used to check access permission of current tenant to the
 * logged in user.
 */
@Singleton
public class PostSessionTenantFilter extends AbstractTenantFilter {

  private static final String INDEX_PAGE = "/index.jsp";

  @Override
  public void doFilterInternal(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    final HttpServletRequest req = (HttpServletRequest) request;
    if (INDEX_PAGE.equals(req.getServletPath())) {
      final HttpSession session = req.getSession();
      final Map<String, String> tenants = getTenants(false);
      final String tenantId = (String) session.getAttribute(SESSION_KEY_TENANT_ID);
      if (!tenants.containsKey(tenantId)) {
        session.invalidate();
        WebUtils.issueRedirect(request, response, "/");
        return;
      }
      req.getSession().setAttribute(SESSION_KEY_TENANT_MAP, getTenants(false));
    }
    chain.doFilter(request, response);
  }
}

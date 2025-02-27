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
package com.axelor.db;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.axelor.JpaTest;
import com.axelor.JpaTestModule;
import com.axelor.inject.Beans;
import com.axelor.script.GroovyScriptHelper;
import com.axelor.script.ScriptBindings;
import com.axelor.test.GuiceModules;
import com.axelor.test.db.Contact;
import com.axelor.test.db.repo.ContactRepository;
import com.axelor.test.db.repo.ContactRepositoryEx;
import com.google.inject.persist.Transactional;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import javax.inject.Inject;
import org.junit.jupiter.api.Test;

@GuiceModules(RepositoryTest.MyModule.class)
public class RepositoryTest extends JpaTest {

  public static class MyModule extends JpaTestModule {

    @Override
    protected void configure() {
      bind(ContactRepository.class).to(ContactRepositoryEx.class);
      super.configure();
    }
  }

  @Inject private ContactRepository contacts;

  @Test
  public void test() {
    assertNotNull(contacts);
    assertTrue(contacts instanceof ContactRepositoryEx);

    Query<Contact> q = contacts.all();
    assertNotNull(q);

    // test manual instantiation
    ContactRepository repo = Beans.get(ContactRepository.class);
    assertNotNull(repo);
    assertTrue(repo instanceof ContactRepositoryEx);

    // test manual instantiation by model class name
    JpaRepository<Contact> repo2 = JpaRepository.of(Contact.class);
    assertNotNull(repo2);
    assertTrue(repo2 instanceof ContactRepositoryEx);

    // test groovy expression
    ScriptBindings bindings = new ScriptBindings(new HashMap<String, Object>());
    GroovyScriptHelper helper = new GroovyScriptHelper(bindings);
    String expr = "__repo__(Contact)";
    Object obj = helper.eval(expr);
    assertNotNull(obj);
    assertTrue(obj instanceof ContactRepositoryEx);
  }

  @Test
  @Transactional
  public void testFindByIds() {
    List<Contact> contacts = Beans.get(ContactRepository.class).findByIds(Arrays.asList(1L, 2L));
    assertNotNull(contacts);
    assertEquals(2, contacts.size());
  }
}

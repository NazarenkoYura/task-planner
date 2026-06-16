from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Project, Task, Tag

class TaskPlannerAPITests(APITestCase):

    def setUp(self):
        # Создаем двух тестовых пользователей для проверки изоляции данных
        self.user1 = User.objects.create_user(username='testuser1', password='password123', email='user1@test.com')
        self.user2 = User.objects.create_user(username='testuser2', password='password123', email='user2@test.com')
        
        # Системные роуты API для тестов
        self.register_url = reverse('user-list')       # /api/users/
        self.login_url = reverse('api_token_auth')     # /api/auth/login/
        self.project_url = reverse('project-list')     # /api/projects/
        self.task_url = reverse('task-list')           # /api/tasks/

    def test_user_registration(self):
        """Тестирование регистрации нового пользователя"""
        data = {
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "newpassword123"
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username="newuser").count(), 1)

    def test_user_login(self):
        """Тестирование авторизации и получения токена"""
        data = {
            "username": "testuser1",
            "password": "password123"
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_create_project_authenticated(self):
        """Тестирование создания проекта авторизованным пользователем"""
        # Авторизуем пользователя 1
        self.client.force_authenticate(user=self.user1)
        data = {
            "name": "Тестовый проект",
            "description": "Описание проекта"
        }
        response = self.client.post(self.project_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.filter(owner=self.user1).count(), 1)

    def test_project_access_denied_anonymous(self):
        """Тестирование ограничения доступа к проектам без авторизации"""
        response = self.client.get(self.project_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_project_isolation(self):
        """Тестирование изоляции проектов (пользователь не видит чужие проекты)"""
        # Создаем проект от имени пользователя 1
        Project.objects.create(name="Проект Юзера 1", owner=self.user1)
        
        # Авторизуем пользователя 2 и запрашиваем список проектов
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(self.project_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Пользователь 2 должен получить пустой список проектов
        self.assertEqual(len(response.data), 0)

    def test_create_task_with_project(self):
        """Тестирование создания задачи с привязкой к проекту"""
        self.client.force_authenticate(user=self.user1)
        project = Project.objects.create(name="Рабочий проект", owner=self.user1)
        
        data = {
            "title": "Тестовая задача",
            "description": "Описание задачи",
            "status": "todo",
            "project": project.id
        }
        response = self.client.post(self.task_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.filter(assignee=self.user1).count(), 1)
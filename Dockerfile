# Step 1: Build the React frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend

COPY src/JapanTripPlanner.App/package.json ./
RUN npm install

COPY src/JapanTripPlanner.App/ ./
RUN npm run build

# Step 2: Build the .NET 10 backend
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

COPY JapanTripPlanner.slnx ./
COPY src/JapanTripPlanner.Server/JapanTripPlanner.Server.csproj src/JapanTripPlanner.Server/
RUN dotnet restore src/JapanTripPlanner.Server/JapanTripPlanner.Server.csproj

COPY . .
RUN dotnet publish src/JapanTripPlanner.Server/JapanTripPlanner.Server.csproj \
    --configuration Release \
    --output /app/publish \
    /p:UseAppHost=false

# Step 3: Runtime container
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8096
ENV ASPNETCORE_ENVIRONMENT=Production
ENV JapanTripPlanner__UploadsDirectory=/app/uploads

EXPOSE 8096

RUN mkdir -p /app/uploads && mkdir -p /app/wwwroot

COPY --from=build /app/publish .
COPY --from=frontend-build /app/frontend/dist ./wwwroot

ENTRYPOINT ["dotnet", "JapanTripPlanner.Server.dll"]

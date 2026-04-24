# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copia só o csproj primeiro (cache melhor)
COPY FicaFrio/*.csproj ./FicaFrio/
WORKDIR /app/FicaFrio

RUN dotnet restore

# Copia o resto
COPY FicaFrio/. ./

# Publica
RUN dotnet publish -c Release -o /app/out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

ENV ASPNETCORE_URLS=http://+:10000

ENTRYPOINT ["dotnet", "FicaFrio.dll"]
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 80
EXPOSE 443
COPY bin/Release/net8.0/publish/ .
ENTRYPOINT ["dotnet", "FicaFrio.dll"]